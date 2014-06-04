// Load modules

var Querystring = require('querystring');
var Url = require('url');
var Hoek = require('hoek');
var Boom = require('boom');
var Cryptiles = require('cryptiles');
var Nipple = require('nipple');
var OAuth = require('oauth');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports.v1 = function (options) {

    var client = new OAuth.OAuth(options.temporary,
                                 options.token,
                                 options.clientId,
                                 options.clientSecret,
                                 '1.0',
                                 options.endpoint,
                                 'HMAC-SHA1');

    return function (request, reply) {

        var self = this;

        var cookie = this.settings.cookie;
        var provider = (typeof this.settings.provider === 'object' ? 'custom' : this.settings.provider);

        // Sign-in Initialization

        if (!request.query.oauth_token) {

            // Obtain temporary OAuth credentials

            return client.getOAuthRequestToken(function (err, token, secret, authorizeUri, params) {

                if (err) {
                    return reply(Boom.internal('Failed to obtain a ' + provider + ' request token', err));
                }

                var state = {
                    provider: provider,
                    status: 'pending',
                    token: token,
                    secret: secret,
                    next: request.query.next && request.query.next.charAt(0) === '/' && request.query.next      // Protect against open redirector
                };

                reply.state(cookie, state);

                var query = Hoek.clone(self.settings.providerParams) || {};
                query.oauth_token = token;

                return reply('You are being redirected...').redirect(options.auth + '?' + Querystring.encode(query));
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

        client.getOAuthAccessToken(state.token, state.secret, request.query.oauth_verifier, function (err, token, secret, params) {

            if (err) {
                return reply(Boom.internal('Failed to obtain a ' + provider + ' access token', err));
            }

            var credentials = {
                provider: provider,
                status: 'authenticated',
                token: token,
                secret: secret
            };

            if (!options.profile) {
                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            }

            // Obtain user profile

            options.profile.call(self, credentials, params, client, function (err) {

                if (err) {
                    return reply(err);
                }

                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            });
        });
    };
};


exports.v2 = function (options) {

    return function (request, reply) {

        var self = this;

        var cookie = this.settings.cookie;
        var provider = (typeof this.settings.provider === 'object' ? 'custom' : this.settings.provider);

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
            return reply('You are being redirected...').redirect(options.auth + '?' + Querystring.encode(query));
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
                return reply('You are being redirected...').redirect(state.next);
            }

            // Obtain user profile

            options.profile.call(self, credentials, function (err) {

                if (err) {
                    return reply(err);
                }

                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            });
        });
    };
};
