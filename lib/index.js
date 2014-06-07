// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var OAuth = require('./oauth');
var Providers = require('./providers');


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
    Hoek.assert(options.provider, 'Missing provider name');

    var settings = Hoek.cloneWithShallow(options, 'provider');      // Options can be reused

    // Lookup provider

    if (typeof settings.provider === 'object') {
        settings.name = 'custom';
    }
    else {
        settings.name = settings.provider;
        settings.provider = Providers[settings.provider];
        Hoek.assert(settings.provider, 'Unknown provider:', settings.name);
    }

    Hoek.assert(['oauth', 'oauth2'].indexOf(settings.provider.protocol) !== -1, '');

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

    settings.cookie = settings.cookie || 'bell-' + settings.name;
    server.state(settings.cookie, cookieOptions);

    // Setup route for receiving third-party authorization

    settings.path = settings.path || '/bell/' + settings.name;
    var handler = (settings.provider.protocol === 'oauth' ? OAuth.v1 : OAuth.v2);

    server.route({
        method: '*',
        path: settings.path,
        config: {
            auth: false,
            bind: { settings: settings },
            handler: handler
        }
    });

    var scheme = {
        authenticate: function (request, reply) {

            var credentials = request.state[settings.cookie];
            if (credentials &&
                credentials.provider === settings.name) {

                reply.unstate(settings.cookie);
                return reply(null, { credentials: credentials });
            }

            return reply.redirect(settings.path + '?next=' + encodeURIComponent(request.url.path));
        }
    };

    return scheme;
};