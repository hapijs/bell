// Load modules

var Querystring = require('querystring');
var Crypto = require('crypto');
var Url = require('url');
var Hoek = require('hoek');
var Boom = require('boom');
var Cryptiles = require('cryptiles');
var Nipple = require('nipple');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports.v1 = function (provider, options) {

    var client = new internals.Client(provider, options);

    return function (request, reply) {

        var self = this;

        var cookie = this.settings.cookie;

        // Sign-in Initialization

        if (!request.query.oauth_token) {

            // Obtain temporary OAuth credentials

            var oauth_callback = request.server.location(this.settings.path, request);
            return client.temporary(oauth_callback, function (err, payload) {

                if (err) {
                    return reply(err);
                }

                var state = {
                    provider: provider,
                    status: 'pending',
                    token: payload.oauth_token,
                    secret: payload.oauth_token_secret,
                    next: request.query.next && request.query.next.charAt(0) === '/' && request.query.next      // Protect against open redirector
                };

                reply.state(cookie, state);

                var query = Hoek.clone(self.settings.providerParams) || {};
                query.oauth_token = payload.oauth_token;

                return reply.redirect(options.auth + '?' + Querystring.encode(query));
            });
        }

        // Authorization callback

        if (!request.query.oauth_verifier) {
            return reply(Boom.internal('Missing verifier parameter in ' + provider + ' authorization response'));
        }

        var state = request.state[cookie];
        if (!state) {
            return reply(Boom.internal('Missing ' + provider + ' request token cookie'));
        }

        if (state.provider !== provider) {
            return reply(Boom.internal('Authentication wires crossed between providers'));
        }

        if (request.query.oauth_token !== state.token) {
            return reply(Boom.internal('' + provider + ' authorized request token mismatch'));
        }

        // Obtain token OAuth credentials

        client.token(state.token, request.query.oauth_verifier, state.secret, function (err, payload) {

            if (err) {
                return reply(err);
            }

            var credentials = {
                provider: provider,
                status: 'authenticated',
                token: payload.oauth_token,
                secret: payload.oauth_token_secret
            };

            if (!options.profile) {
                reply.state(cookie, credentials);
                return reply.redirect(state.next);
            }

            // Obtain user profile

            var get = function (uri, params, callback) {

                return client.get(uri, params, payload.oauth_token, payload.oauth_token_secret, function (err, response) {

                    if (err) {
                        return reply(err);
                    }

                    callback(response);
                });
            };

            options.profile.call(self, credentials, payload, get, function (err) {

                if (err) {
                    return reply(err);
                }

                reply.state(cookie, credentials);
                return reply.redirect(state.next);
            });
        });
    };
};


exports.v2 = function (provider, options) {

    return function (request, reply) {

        var self = this;

        var cookie = this.settings.cookie;

        // Sign-in Initialization

        if (!request.query.code) {
            var nonce = Cryptiles.randomString(22);

            var query = Hoek.clone(this.settings.providerParams) || {};
            query.client_id = options.clientId;
            query.response_type = 'code';
            var scope = this.settings.scope || options.scope;
            if (scope) {
                query.scope = scope.join(options.scopeSeparator || ' ');
            }
            query.redirect_uri = this.settings.endpoint;
            query.state = nonce;

            var state = {
                provider: provider,
                status: 'pending',
                nonce: nonce,
                next: request.query.next && request.query.next.charAt(0) === '/' && request.query.next      // Protect against open redirector
            };

            reply.state(cookie, state);
            return reply.redirect(options.auth + '?' + Querystring.encode(query));
        }

        // Authorization callback

        var state = request.state[cookie];
        if (!state) {
            return reply(Boom.internal('Missing ' + provider + ' request token cookie'));
        }

        if (state.provider !== provider) {
            return reply(Boom.internal('Authentication wires crossed between providers'));
        }

        if (!state.nonce) {
            return reply(Boom.internal('Missing ' + provider + ' nonce information'));
        }

        if (state.nonce !== request.query.state) {
            return reply(Boom.internal('Incorrect ' + provider + ' state parameter'));
        }

        var query = {
            client_id: options.clientId,
            client_secret: options.clientSecret,
            grant_type: 'authorization_code',
            code: request.query.code,
            redirect_uri: this.settings.endpoint
        };

        var requestOptions = {
            payload: Querystring.stringify(query),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        if (options.headers) {
            Hoek.merge(requestOptions.headers, options.headers);
        }

        // Obtain token

        Nipple.post(options.token, requestOptions, function (err, res, payload) {

            if (err ||
                res.statusCode !== 200) {

                return reply(Boom.internal('Failed obtaining ' + provider + ' access token', err || payload));
            }

            payload = Utils.parse(payload);
            if (payload instanceof Error) {
                return reply(Boom.internal('Received invalid payload from ' + provider + ' access token endpoint', payload));
            }

            var credentials = {
                provider: provider,
                status: 'authenticated',
                token: payload.access_token,
                refreshToken: payload.refresh_token
            };

            if (!options.profile) {
                reply.state(cookie, credentials);
                return reply.redirect(state.next);
            }

            // Obtain user profile

            var get = function (uri, params, callback) {

                var getOptions = (options.headers ? { headers: options.headers } : {});
                var query = { access_token: payload.access_token };
                if (params) {
                    Hoek.merge(query, params);
                }

                Nipple.get(uri + '?' + Querystring.encode(query), getOptions, function (err, res, response) {

                    if (err ||
                        res.statusCode !== 200) {

                        return reply(Boom.internal('Failed obtaining ' + provider + ' user profile', err || response));
                    }

                    response = Utils.parse(response);
                    if (response instanceof Error) {
                        return reply(Boom.internal('Received invalid payload from ' + provider + ' user profile', response));
                    }

                    return callback(response);
                });
            };

            options.profile.call(self, credentials, payload, get, function (err) {

                if (err) {
                    return reply(err);
                }

                reply.state(cookie, credentials);
                return reply.redirect(state.next);
            });
        });
    };
};


exports.Client = internals.Client = function (provider, options) {

    this.provider = provider;
    this.settings = {
        temporary: this.baseUri(options.temporary),
        token: this.baseUri(options.token),
        clientId: options.clientId,
        clientSecret: internals.encode(options.clientSecret || '') + '&'
    };
};


internals.Client.prototype.temporary = function (oauth_callback, callback) {

    // Temporary Credentials (2.1)

    var oauth = {
        oauth_callback: oauth_callback
    };

    this.request('post', this.settings.temporary, null, oauth, undefined, 'temporary credentials', callback);
};


internals.Client.prototype.token = function (oauth_token, oauth_verifier, tokenSecret, callback) {

    // Token Credentials (2.3)

    var oauth = {
        oauth_token: oauth_token,
        oauth_verifier: oauth_verifier
    };

    this.request('post', this.settings.token, null, oauth, tokenSecret, 'token credentials', callback);
};


internals.Client.prototype.get = function (uri, params, oauth_token, tokenSecret, callback) {

    // Making Requests (3.1)

    var oauth = {
        oauth_token: oauth_token
    };

    this.request('get', uri, params, oauth, tokenSecret, 'token credentials', callback);
};


internals.Client.prototype.request = function (method, uri, params, oauth, tokenSecret, type, callback) {

    var provider = this.provider;

    oauth.oauth_nonce = Cryptiles.randomString(22);
    oauth.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    oauth.oauth_consumer_key = this.settings.clientId;
    oauth.oauth_signature_method = 'HMAC-SHA1';
    oauth.oauth_signature = this.signature(method, uri, params, oauth, tokenSecret);

    var query = params ? ('?' + Querystring.encode(params)) : '';
    Nipple[method](uri + query, { headers: { Authorization: this.header(oauth) } }, function (err, res, payload) {

        if (err ||
            res.statusCode !== 200) {

            return callback(Boom.internal('Failed obtaining ' + provider + ' ' + type, err || payload));
        }

        payload = Utils.parse(payload);
        if (payload instanceof Error) {
            return callback(Boom.internal('Received invalid payload from ' + provider + ' ' + type + ' endpoint', payload));
        }

        return callback(null, payload);
    });
};


internals.Client.prototype.header = function (oauth) {

    // Authorization Header (3.5.1)

    var header = 'OAuth ';
    var names = Object.keys(oauth);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        header += (i ? ', ' : '') + name + '="' + internals.encode(oauth[name]) + '"';
    }

    return header;
};


internals.Client.prototype.baseUri = function (uri) {

    // Base String URI (3.4.1.2)

    var resource = Url.parse(uri, true);

    var protocol = resource.protocol.toLowerCase();
    var isDefaultPort = resource.port && ((protocol === 'http:' && resource.port === '80') || (protocol === 'https:' && resource.port === '443'));
    var baseUri = protocol + '//' + resource.hostname.toLowerCase() + (isDefaultPort || !resource.port ? '' : ':' + resource.port) + resource.pathname;
    return baseUri;
};


internals.Client.prototype.signature = function (method, baseUri, params, oauth, tokenSecret) {

    // Parameters Normalization (3.4.1.3.2)

    var normalized = [];
    var normalize = function (source) {
        var names = Object.keys(source);
        for (var i = 0, il = names.length; i < il; ++i) {
            var name = names[i];
            var value = source[name];

            var encodedName = internals.encode(name);
            if (Array.isArray(value)) {
                for (var v = 0, vl = value.length; v < vl; ++v) {
                    normalized.push([encodedName, internals.encode(value[v])]);
                }
            }
            else {
                normalized.push([encodedName, internals.encode(value)]);
            }
        }
    };

    if (params) {
        normalize(params);
    }

    normalize(oauth);

    normalized.sort(function (a, b) {

        return (a[0] < b[0] ? -1
                            : (a[0] > b[0] ? 1
                                           : (a[1] < b[1] ? -1
                                                          : (a[1] > b[1] ? 1 : 0))));
    });

    var normalizedParam = '';
    for (var i = 0, il = normalized.length; i < il; ++i) {
        normalizedParam += (i ? '&' : '') + normalized[i][0] + '=' + normalized[i][1];
    }

    // String Construction (3.4.1.1)

    var baseString = internals.encode(method.toUpperCase()) + '&' +
                     internals.encode(baseUri) + '&' +
                     internals.encode(normalizedParam);

    // HMAC-SHA1 (3.4.2)

    var key = tokenSecret ? (this.settings.clientSecret + internals.encode(tokenSecret)) : this.settings.clientSecret;
    return Crypto.createHmac('sha1', key).update(baseString).digest('base64');
};


internals.encodeLookup = function () {

    var lookup = {};
    for (var i = 0; i < 128; ++i) {
        if ((i >= 48 && i <= 57) || // 09
            (i >= 65 && i <= 90) || // AZ
            (i >= 97 && i <= 122) || // az
            i == 45 || // -
            i == 95 || // _
            i == 46 || // .
            i == 126) // ~
        {
            lookup[i] = String.fromCharCode(i);
        }
        else {
            lookup[i] = '%' + i.toString(16).toUpperCase();
        }
    }

    return lookup;
}();


internals.encode = function (string) {

    if (!string) {
        return '';
    }

    // Percent Encoding (3.6)

    var encoded = '';

    for (var i = 0, il = string.length; i < il; ++i) {
        encoded += internals.encodeLookup[string.charCodeAt(i)];
    }

    return encoded;
};
