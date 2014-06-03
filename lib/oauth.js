// Load modules

var Querystring = require('querystring');
var Url = require('url');
var Boom = require('boom');
var Cryptiles = require('cryptiles');
var Nipple = require('nipple');
var OAuth = require('oauth');


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

        var cookie = this.settings.cookie;
        var provider = this.settings.provider;

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
                return reply('You are being redirected...').redirect(options.auth + '?oauth_token=' + token);
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
                secret: secret,
                profile: {
                    id: params.user_id,
                    username: params.screen_name
                }
            };

            if (!options.profile) {
                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            }

            // Obtain user profile

            client.getProtectedResource('https://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile?format=json', 'GET', token, secret, function (err, response) {

                var payload = internals.parse(response);
                if (payload instanceof Error) {
                    return reply(Boom.internal('Received invalid payload from ' + provider + ' user profile', payload));
                }

                credentials.profile = payload;

                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            });
        });
    };
};


exports.v2 = function (options) {

    return function (request, reply) {

        var cookie = this.settings.cookie;
        var provider = this.settings.provider;

        // Sign-in Initialization

        if (!request.query.code) {
            var nonce = Cryptiles.randomString(22);
            var query = Querystring.encode({
                client_id: options.clientId,
                response_type: 'code',
                scope: 'email',
                redirect_uri: this.settings.endpoint,
                state: nonce,
                display: 'page' // 'touch'
            });

            var state = {
                provider: provider,
                status: 'pending',
                nonce: nonce,
                next: request.query.next && request.query.next.charAt(0) === '/' && request.query.next      // Protect against open redirector
            };

            reply.state(cookie, state);
            return reply('You are being redirected...').redirect(options.auth + '?' + query);
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

        // Obtain token

        Nipple.post(options.token, requestOptions, function (err, res, payload) {

            if (err ||
                res.statusCode !== 200) {

                return reply(Boom.internal('Failed obtaining ' + provider + ' access token', err || payload));
            }

            payload = internals.parse(payload);
            if (payload instanceof Error) {
                return reply(Boom.internal('Received invalid payload from ' + provider + ' access token endpoint', payload));
            }

            var credentials = {
                provider: provider,
                status: 'authenticated',
                token: payload.access_token
            };

            if (!options.profile) {
                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            }

            // Obtain profile

            Nipple.get(options.profile + '?' + Querystring.stringify({ access_token: payload.access_token }), function (err, res, payload) {

                if (err ||
                    res.statusCode !== 200) {

                    return reply(Boom.internal('Failed obtaining ' + provider + ' user profile', err || payload));
                }

                payload = internals.parse(payload);
                if (payload instanceof Error) {
                    return reply(Boom.internal('Received invalid payload from ' + provider + ' user profile', payload));
                }

                credentials.profile = payload;

                reply.state(cookie, credentials);
                return reply('You are being redirected...').redirect(state.next);
            });
        });
    };
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