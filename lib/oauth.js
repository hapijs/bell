// Load modules

var Querystring = require('querystring');
var Url = require('url');
var Boom = require('boom');
var Cryptiles = require('cryptiles');
var Crypto = require('crypto');
var Hoek = require('hoek');
var Wreck = require('wreck');


// Declare internals

var internals = {};


exports.v1 = function (settings) {

    var client = new internals.Client(settings);

    return function (request, reply) {

        var cookie = settings.cookie;
        var name = settings.name;
        var query = request.query;
        var protocol = request.connection.info.protocol;

        // Bail if the upstream service returns an error

        if (query.error === 'access_denied' ||
            query.denied) {

            return reply(Boom.internal('Application rejected'));
        }

        // Sign-in Initialization

        if (!request.query.oauth_token) {

            // Obtain temporary OAuth credentials

            if (settings.forceHttps) {
                protocol = 'https';
            }
            var oauth_callback = internals.location(request, protocol, settings.location);
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

                var authQuery = settings.providerParams ? Hoek.clone(settings.providerParams) : {};
                authQuery.oauth_token = payload.oauth_token;

                if (settings.allowRuntimeProviderParams ) {
                    Hoek.merge(authQuery, request.query);
                }

                return reply.redirect(settings.provider.auth + '?' + internals.queryString(authQuery));
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
                return reply.continue({ credentials: credentials });
            }

            // Obtain user profile

            var get = function (uri, params, callback) {

                if (settings.profileParams) {
                    Hoek.merge(params, settings.profileParams);
                }

                return client.resource('get', uri, params, { token: payload.oauth_token, secret: payload.oauth_token_secret }, function (err, response) {

                    if (err) {
                        return reply(err);
                    }

                    callback(response);
                });
            };

            settings.provider.profile.call(settings, credentials, payload, get, function () {

                return reply.continue({ credentials: credentials });
            });
        });
    };
};


exports.v2 = function (settings) {

    return function (request, reply) {

        var cookie = settings.cookie;
        var name = settings.name;
        var protocol;
        var query;
        var state;

        // Bail if the upstream service returns an error
        if (request.query.error === 'access_denied' || request.query.denied) {
            return reply(Boom.internal('App was rejected'));
        }

        // Sign-in Initialization

        if (!request.query.code) {
            var nonce = Cryptiles.randomString(22);
            query = Hoek.clone(settings.providerParams) || {};

            if (settings.allowRuntimeProviderParams ) {
                Hoek.merge(query, request.query);
            }

            protocol = settings.forceHttps ? 'https' : request.connection.info.protocol;
            query.client_id = settings.clientId;
            query.response_type = 'code';
            query.redirect_uri = internals.location(request, protocol, settings.location);
            query.state = nonce;

            var scope = settings.scope || settings.provider.scope;
            if (scope) {
                query.scope = scope.join(settings.provider.scopeSeparator || ' ');
            }

            state = {
                nonce: nonce,
                query: request.query
            };

            reply.state(cookie, state);
            return reply.redirect(settings.provider.auth + '?' + internals.queryString(query));
        }

        // Authorization callback

        state = request.state[cookie];
        if (!state) {
            return reply(Boom.internal('Missing ' + name + ' request token cookie'));
        }

        reply.unstate(cookie);

        if (state.nonce !== request.query.state) {
            return reply(Boom.internal('Incorrect ' + name + ' state parameter'));
        }

        protocol = request.connection.info.protocol;
        if (settings.forceHttps) {
            protocol = 'https';
        }

        query = {
            grant_type: 'authorization_code',
            code: request.query.code,
            redirect_uri: internals.location(request, protocol, settings.location)
        };

        if (settings.provider.useParamsAuth) {
            query.client_id = settings.clientId;
            query.client_secret = settings.clientSecret;
        }

        var requestOptions = {
            payload: internals.queryString(query),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        if (!settings.provider.useParamsAuth) {
            requestOptions.headers.Authorization = 'Basic ' + (new Buffer(settings.clientId + ':' + settings.clientSecret, 'utf8')).toString('base64');
        }

        if (settings.provider.headers) {
            Hoek.merge(requestOptions.headers, settings.provider.headers);
        }

        // Obtain token

        Wreck.post(settings.provider.token, requestOptions, function (err, tokenRes, payload) {

            if (err ||
                tokenRes.statusCode !== 200) {

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
                expiresIn: payload.expires_in,
                query: state.query
            };

            if (!settings.provider.profile) {
                return reply.continue({ credentials: credentials });
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

                var getQuery = (params ? '?' + internals.queryString(params) : '');
                Wreck.get(uri + getQuery, getOptions, function (err, res, response) {

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

                return reply.continue({ credentials: credentials });
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

    this._request('post', this.settings.temporary, null, oauth, { desc: 'temporary credentials' }, callback);
};


internals.Client.prototype.token = function (oauthToken, oauthVerifier, tokenSecret, callback) {

    // Token Credentials (2.3)

    var oauth = {
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier
    };

    this._request('post', this.settings.token, null, oauth, { secret: tokenSecret, desc: 'token credentials' }, callback);
};


internals.Client.prototype.resource = function (method, uri, params, options, callback) {

    // Making Requests (3.1)

    var oauth = {
        oauth_token: options.token
    };

    return this._request(method, uri, params, oauth, options, callback);
};


internals.Client.prototype._request = function (method, uri, params, oauth, options, callback) {

    var self = this;

    method = method.toLowerCase();

    // Prepare generic OAuth parameters

    oauth.oauth_nonce = Cryptiles.randomString(22);
    oauth.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    oauth.oauth_consumer_key = this.settings.clientId;
    oauth.oauth_signature_method = 'HMAC-SHA1';
    oauth.oauth_signature = this.signature(method, uri, params, oauth, options.secret);

    if (this.settings.version) {
        oauth.oauth_version = this.settings.version;
    }

    // Calculate OAuth header

    var requestOptions = {
        headers: {
            Authorization: internals.Client.header(oauth)
        }
    };

    if (params) {
        var paramsString = internals.queryString(params);
        if (method === 'get') {
            uri += '?' + paramsString;
        }
        else {
            requestOptions.payload = paramsString;
            requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
    }

    if (options.stream) {
        return Wreck.request(method, uri, requestOptions, callback);
    }

    var desc = (options.desc || 'resource');
    Wreck[method](uri, requestOptions, function (err, res, payload) {

        if (err) {
            return callback(Boom.internal('Failed obtaining ' + self.provider + ' ' + desc, err));
        }

        if (res.statusCode !== 200) {
            return callback(Boom.internal('Failed obtaining ' + self.provider + ' ' + desc, payload), payload, res.statusCode);
        }

        payload = internals.parse(payload);
        if (payload instanceof Error) {
            return callback(Boom.internal('Received invalid payload from ' + self.provider + ' ' + desc + ' endpoint', payload), payload, res.statusCode);
        }

        return callback(null, payload, res.statusCode);
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
        if ((i >= 48 && i <= 57) ||     // 09
            (i >= 65 && i <= 90) ||     // AZ
            (i >= 97 && i <= 122) ||    // az
            i === 45 ||                 // -
            i === 95 ||                 // _
            i === 46 ||                 // .
            i === 126)                  // ~
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

    payload = Buffer.isBuffer(payload) ? payload.toString() : payload;
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


internals.location = function (request, protocol, location) {

    if (location) {
        return location + request.path;
    }
    var info = request.connection.info;
    // Turning off Lab coverage because of differences between Hapi 9 and 10
    /* $lab:coverage:off$ */
    var host = request.info.host || (info.host + ':' + info.port);
    /* $lab:coverage:on$ */
    return protocol + '://' + host + request.path;
};


// Provide own QS implementation for cross node version support

internals.encodePrimitive = function (value) {

    var type = typeof value;
    if (type === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (type === 'number') {
        return isFinite(value) ? value.toString() : '';
    }

    return internals.encode(value);
};


internals.Client.queryString = internals.queryString = function (params) {

    var keys = Object.keys(params);
    var fields = [];
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var value = params[key];
        var ks = internals.encodePrimitive(key) + '=';

        if (Array.isArray(value)) {
            for (var j = 0, jl = value.length; j < jl; ++j) {
                fields.push(ks + internals.encodePrimitive(value[j]));
            }
        }
        else {
            fields.push(ks + internals.encodePrimitive(value));
        }
    }

    var qs = fields.join('&');
    return qs;
};
