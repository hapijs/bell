// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var OAuth = require('oauth');


// Declare internals

var internals = {};


exports.register = function (plugin, options, next) {

    plugin.auth.scheme('bell', internals.implementation);
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.implementation = function (server, options) {

    Hoek.assert(options, 'Missing cookie auth strategy options');
    Hoek.assert(!options.validateFunc || typeof options.validateFunc === 'function', 'Invalid validateFunc method in configuration');
    Hoek.assert(options.password, 'Missing required password in configuration');
    Hoek.assert(!options.appendNext || options.redirectTo, 'Cannot set appendNext without redirectTo');

    var settings = Hoek.clone(options);                        // Options can be reused
    settings.cookie = settings.cookie || 'sid';

    var cookieOptions = {
        encoding: 'iron',
        path: '/',
        password: settings.password,
        isSecure: settings.isSecure !== false,                  // Defaults to true
        isHttpOnly: settings.isHttpOnly !== false               // Defaults to true
    };

    if (settings.ttl) {
        cookieOptions.ttl = settings.ttl;
    }

    if (settings.domain) {
        cookieOptions.domain = settings.domain;
    }

    if (typeof settings.appendNext === 'boolean') {
        settings.appendNext = (settings.appendNext ? 'next' : '');
    }

    server.state(settings.cookie, cookieOptions);

    server.ext('onPreAuth', function (request, reply) {

        request.auth.session = {
            set: function (session) {

                Hoek.assert(session && typeof session === 'object', 'Invalid session');
                reply.state(settings.cookie, session);
            },
            clear: function () {

                reply.unstate(settings.cookie);
            }
        };

        reply();
    });

    var scheme = {
        authenticate: function (request, reply) {

            var validate = function () {

                // Check cookie

                var session = request.state[settings.cookie];
                if (!session) {
                    return unauthenticated(Boom.unauthorized());
                }

                if (!settings.validateFunc) {
                    return reply(null, { credentials: session });
                }

                settings.validateFunc(session, function (err, isValid, credentials) {

                    if (err ||
                        !isValid) {

                        if (settings.clearInvalid) {
                            reply.unstate(settings.cookie);
                        }

                        return unauthenticated(Boom.unauthorized('Invalid cookie'), { credentials: credentials, log: (err ? { data: err } : 'Failed validation') });
                    }

                    if (credentials) {
                        reply.state(settings.cookie, credentials);
                    }

                    return reply(null, { credentials: credentials || session });
                });
            };

            var unauthenticated = function (err, result) {

                if (!settings.redirectTo) {
                    return reply(err, result);
                }

                var uri = settings.redirectTo;
                if (settings.appendNext) {
                    if (uri.indexOf('?') !== -1) {
                        uri += '&';
                    }
                    else {
                        uri += '?';
                    }

                    uri += settings.appendNext + '=' + encodeURIComponent(request.url.path);
                }

                return reply('You are being redirected...', result).redirect(uri);
            };

            validate();
        }
    };

    return scheme;
};


internals.auth = function (request, reply) {

    var self = this;

    // Preserve parameters for OAuth authorization callback

    if (request.query.x_next &&
        request.query.x_next.charAt(0) === '/') {        // Prevent being used an open redirector

        request.session.set('auth', { next: request.query.x_next });
    }

    if (!request.server.app.twitterClient) {
        request.server.app.twitterClient = new OAuth.OAuth('https://api.twitter.com/oauth/request_token',
                                                  'https://api.twitter.com/oauth/access_token',
                                                   self.config.login.twitter.clientId,
                                                   self.config.login.twitter.clientSecret,
                                                   '1.0',
                                                   self.config.server.web.uri + '/auth/twitter',
                                                   'HMAC-SHA1');
    }

    // Sign-in Initialization

    if (!request.query.oauth_token) {
        return request.server.app.twitterClient.getOAuthRequestToken(function (err, token, secret, authorizeUri, params) {

            if (err) {
                return reply(Boom.internal('Failed to obtain a Twitter request token', err));
            }

            request.session.set('twitter', { token: token, secret: secret });
            return reply().redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + token);
        });
    }

    // Authorization callback

    if (!request.query.oauth_verifier) {
        return reply(Boom.internal('Missing verifier parameter in Twitter authorization response'));
    }

    var credentials = request.session.get('twitter', true);
    if (!credentials) {
        return reply(Boom.internal('Missing Twitter request token cookie'));
    }

    if (request.query.oauth_token !== credentials.token) {
        return reply(Boom.internal('Twitter authorized request token mismatch'));
    }

    request.server.app.twitterClient.getOAuthAccessToken(credentials.token, credentials.secret, request.query.oauth_verifier, function (err, token, secret, params) {

        if (err) {
            return reply(Boom.internal('Failed to obtain a Twitter access token', err));
        }

        if (!params.user_id) {
            return reply(Boom.internal('Invalid Twitter access token response', err));
        }

        var account = {
            network: 'twitter',
            id: params.user_id,
            username: params.screen_name || ''
        };

        var authSession = request.session.get('auth', true);
        var destination = (authSession && authSession.next);
        exports.loginCall(self, account.network, account.id, request, destination, account, reply);
    });
};


