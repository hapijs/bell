// Load modules

var Querystring = require('querystring');
var Crypto = require('crypto');
var Url = require('url');
var Hoek = require('hoek');
var Boom = require('boom');
var Cryptiles = require('cryptiles');
var Wreck = require('wreck');


// Declare internals

var internals = {};


exports.v1 = function (settings) {

    var client = new internals.Client(settings);

    return function (request, reply) {

        var cookie = settings.cookie;
        var name = settings.name;
        var query = request.query;

        // Bail if the upstream service returns an error
        if (query.error === 'access_denied' || query.denied) {
          return reply(Boom.internal('App was rejected'));
        }

        // Sign-in Initialization

        if (!request.query.oauth_token) {

            // Obtain temporary OAuth credentials

            var oauth_callback = request.server.location(request.path, request);
            return client.temporary(oauth_callback, function (err, payload) {

                if (err) {
                    return reply(err);
                }

                var state = {
                    token: payload.oauth_token,
                    secret: payload.oauth_token_secret,
                    query: request.query
                };

                reply.state(cookie, state);

                var query = settings.providerParams ? Hoek.clone(settings.providerParams) : {};
                query.oauth_token = payload.oauth_token;

                return reply.redirect(settings.provider.auth + '?' + Querystring.encode(query));
            });
        }

        // Authorization callback

        if (!request.query.oauth_verifier) {
            return reply(Boom.internal('Missing verifier parameter in ' + name + ' authorization response'));
        }

        var state = request.state[cookie];
        if (!state) {
            return reply(Boom.internal('Missing ' + name + ' request token cookie'));
        }

        reply.unstate(cookie);

        if (request.query.oauth_token !== state.token) {
            return reply(Boom.internal(name + ' authorized request token mismatch'));
        }

        // Obtain token OAuth credentials

        client.token(state.token, request.query.oauth_verifier, state.secret, function (err, payload) {

            if (err) {
                return reply(err);
            }

            var credentials = {
                provider: name,
                token: payload.oauth_token,
                secret: payload.oauth_token_secret,
                query: state.query
            };

            if (!settings.provider.profile) {
                return reply(null, { credentials: credentials });
            }

            // Obtain user profile

            var get = function (uri, params, callback) {

                if (settings.profileParams) {
                    Hoek.merge(params, settings.profileParams);
                }

                return client.get(uri, params, payload.oauth_token, payload.oauth_token_secret, function (err, response) {

                    if (err) {
                        return reply(err);
                    }

                    callback(response);
                });
            };

            settings.provider.profile.call(settings, credentials, payload, get, function () {

                return reply(null, { credentials: credentials });
            });
        });
    };
};


exports.v2 = function (settings) {

    return function (request, reply) {

        var cookie = settings.cookie;
        var name = settings.name;

        // Sign-in Initialization

        if (!request.query.code) {
            var nonce = Cryptiles.randomString(22);
            var query = Hoek.clone(settings.providerParams) || {};
            query.client_id = settings.clientId;
            query.response_type = 'code';
            query.redirect_uri = request.server.location(request.path, request);
            query.state = nonce;

            var scope = settings.scope || settings.provider.scope;
            if (scope) {
                query.scope = scope.join(settings.provider.scopeSeparator || ' ');
            }

            var state = {
                nonce: nonce,
                query: request.query
            };

            reply.state(cookie, state);
            return reply.redirect(settings.provider.auth + '?' + Querystring.encode(query));
        }

        // Authorization callback

        var state = request.state[cookie];
        if (!state) {
            return reply(Boom.internal('Missing ' + name + ' request token cookie'));
        }

        reply.unstate(cookie);

        if (state.nonce !== request.query.state) {
            return reply(Boom.internal('Incorrect ' + name + ' state parameter'));
        }

        var query = {
            client_id: settings.clientId,
            client_secret: settings.clientSecret,
            grant_type: 'authorization_code',
            code: request.query.code,
            redirect_uri: request.server.location(request.path, request)
        };

        var requestOptions = {
            payload: Querystring.stringify(query),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
                // Authorization: 'Basic ' +  + (new Buffer(settings.clientId + ':' + settings.clientSecret, 'utf8')).toString('base64')
            }
        };

        if (settings.provider.headers) {
            Hoek.merge(requestOptions.headers, settings.provider.headers);
        }

        // Obtain token

        Wreck.post(settings.provider.token, requestOptions, function (err, res, payload) {

            if (err ||
                res.statusCode !== 200) {

                return reply(Boom.internal('Failed obtaining ' + name + ' access token', err || payload));
            }

            payload = internals.parse(payload);
            if (payload instanceof Error) {
                return reply(Boom.internal('Received invalid payload from ' + name + ' access token endpoint', payload));
            }

            var credentials = {
                provider: name,
                token: payload.access_token,
                refreshToken: payload.refresh_token,
                query: state.query
            };

            if (!settings.provider.profile) {
                return reply(null, { credentials: credentials });
            }

            // Obtain user profile

            var get = function (uri, params, callback) {

                var getOptions = {
                    headers: {
                        Authorization: 'Bearer ' + payload.access_token
                    }
                };

                if (settings.profileParams) {
                    Hoek.merge(params, settings.profileParams);
                }

                if (settings.provider.headers) {
                    Hoek.merge(getOptions.headers, settings.provider.headers);
                }

                var query = (params ? '?' + Querystring.encode(params) : '');
                Wreck.get(uri + query, getOptions, function (err, res, response) {

                    if (err ||
                        res.statusCode !== 200) {

                        return reply(Boom.internal('Failed obtaining ' + name + ' user profile', err || response));
                    }

                    response = internals.parse(response);
                    if (response instanceof Error) {
                        return reply(Boom.internal('Received invalid payload from ' + name + ' user profile', response));
                    }

                    return callback(response);
                });
            };

            settings.provider.profile.call(settings, credentials, payload, get, function () {

                return reply(null, { credentials: credentials });
            });
        });
    };
};


exports.Client = internals.Client = function (options) {

    this.provider = options.name;
    this.settings = {
        temporary: internals.Client.baseUri(options.provider.temporary),
        token: internals.Client.baseUri(options.provider.token),
        clientId: options.clientId,
        clientSecret: internals.encode(options.clientSecret || '') + '&',
        version: options.provider.version || ''
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

    if (this.settings.version) {
        oauth.oauth_version = this.settings.version;
    }

    oauth.oauth_nonce = Cryptiles.randomString(22);
    oauth.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    oauth.oauth_consumer_key = this.settings.clientId;
    oauth.oauth_signature_method = 'HMAC-SHA1';
    oauth.oauth_signature = this.signature(method, uri, params, oauth, tokenSecret);

    var query = params ? ('?' + Querystring.encode(params)) : '';
    Wreck[method](uri + query, { headers: { Authorization: internals.Client.header(oauth) } }, function (err, res, payload) {

        if (err ||
            res.statusCode !== 200) {

            return callback(Boom.internal('Failed obtaining ' + provider + ' ' + type, err || payload));
        }

        payload = internals.parse(payload);
        if (payload instanceof Error) {
            return callback(Boom.internal('Received invalid payload from ' + provider + ' ' + type + ' endpoint', payload));
        }

        return callback(null, payload);
    });
};


internals.Client.header = function (oauth) {

    // Authorization Header (3.5.1)

    var header = 'OAuth ';
    var names = Object.keys(oauth);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        header += (i ? ', ' : '') + name + '="' + internals.encode(oauth[name]) + '"';
    }

    return header;
};


internals.Client.baseUri = function (uri) {

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


internals.parse = function (payload) {

    if (payload[0] === '{') {
        try {
            return JSON.parse(payload);
        }
        catch (err) {
            return err;
        }
    }

    return Querystring.parse(payload);
};
