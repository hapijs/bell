// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var OAuth = require('oauth');


// Declare internals

var internals = {};


exports.register = function (plugin, options, next) {

    plugin.auth.scheme('bell', internals.implementation);
    next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.implementation = function (server, options) {

    Hoek.assert(options, 'Missing cookie auth strategy options');
    Hoek.assert(options.password, 'Missing required password in configuration');

    var settings = Hoek.clone(options);                        // Options can be reused

    // Setup cookie for managing temporary authorization state

    var cookieOptions = {
        encoding: 'iron',
        path: '/',
        password: settings.password,
        isSecure: settings.isSecure !== false,                  // Defaults to true
        isHttpOnly: settings.isHttpOnly !== false,              // Defaults to true
        ttl: settings.ttl,
        domain: settings.domain,
        failAction: 'log',
        clearInvalid: true
    };

    settings.cookie = settings.cookie || 'bell';
    server.state(settings.cookie, cookieOptions);

    // Setup route for receiving third-party authorization

    settings.path = settings.path || '/bell/door';
    settings.endpoint = server.location(settings.path);

    var bind = {
        settings: settings,
        client: new OAuth.OAuth('https://api.twitter.com/oauth/request_token',
                                'https://api.twitter.com/oauth/access_token',
                                settings.clientId,
                                settings.clientSecret,
                                '1.0',
                                settings.endpoint,
                                'HMAC-SHA1')
    };

    server.route({
        method: '*',
        path: settings.path,
        config: {
            auth: false,
            bind: bind,
            handler: internals.endpoint
        }
    });

    var scheme = {
        authenticate: function (request, reply) {

            var credentials = request.state[settings.cookie];
            if (credentials &&
                credentials.status === 'authenticated') {

                reply.unstate(settings.cookie);
                return reply(null, { credentials: credentials });
            }

            return reply('You are being redirected...').redirect(settings.endpoint + '?next=' + encodeURIComponent(request.url.path));
        }
    };

    return scheme;
};


internals.endpoint = function (request, reply) {

    var self = this;

    // Sign-in Initialization

    if (!request.query.oauth_token) {

        // Obtain OAuth temporary credentials

        return this.client.getOAuthRequestToken(function (err, token, secret, authorizeUri, params) {

            if (err) {
                return reply(Boom.internal('Failed to obtain a Twitter request token', err));
            }

            var state = {
                provider: 'twitter',
                status: 'pending',
                token: token,
                secret: secret,
                next: request.query.next && request.query.next.charAt(0) === '/' && request.query.next      // Protect against open redirector
            };

            reply.state(self.settings.cookie, state);
            return reply('You are being redirected...').redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + token);
        });
    }

    // Authorization callback

    if (!request.query.oauth_verifier) {
        return reply(Boom.internal('Missing verifier parameter in Twitter authorization response'));
    }

    var state = request.state[this.settings.cookie];
    if (!state) {
        return reply(Boom.internal('Missing Twitter request token cookie'));
    }

    if (state.provider !== 'twitter') {
        return reply(Boom.internal('Authentication wires crossed between providers'));
    }

    if (request.query.oauth_token !== state.token) {
        return reply(Boom.internal('Twitter authorized request token mismatch'));
    }

    this.client.getOAuthAccessToken(state.token, state.secret, request.query.oauth_verifier, function (err, token, secret, params) {

        if (err) {
            return reply(Boom.internal('Failed to obtain a Twitter access token', err));
        }

        if (!params.user_id) {
            return reply(Boom.internal('Invalid Twitter access token response', err));
        }

        var credentials = {
            provider: 'twitter',
            status: 'authenticated',
            token: token,
            secret: secret,
            id: params.user_id,
            username: params.screen_name || ''
        };

        reply.state(self.settings.cookie, credentials);
        return reply('You are being redirected...').redirect(state.next);
    });
};