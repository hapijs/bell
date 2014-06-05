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

    settings.extendedProfile = true;
    settings.cookie = settings.cookie || 'bell';
    server.state(settings.cookie, cookieOptions);

    // Setup route for receiving third-party authorization

    settings.path = settings.path || '/bell/door';
    settings.endpoint = server.location(settings.path);

    server.route({
        method: '*',
        path: settings.path,
        config: {
            auth: false,
            bind: { settings: settings },
            handler: internals.handler(settings)
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

            return reply.redirect(settings.endpoint + '?next=' + encodeURIComponent(request.url.path));
        }
    };

    return scheme;
};


internals.handler = function (settings) {

    var provider = (typeof settings.provider === 'object' ? settings.provider : Providers[settings.provider]);
    var name = (typeof settings.provider === 'object' ? 'custom' : settings.provider);

    Hoek.assert(provider, 'Unknown provider:', settings.provider);

    if (provider.protocol === 'oauth') {
        var options = Hoek.clone(provider);
        options.clientId = settings.clientId;
        options.clientSecret = settings.clientSecret;

        return OAuth.v1(name, options);
    }
    else {
        Hoek.assert(provider.protocol === 'oauth2', 'Unknown provider protocol:', provider.protocol);
        var options = Hoek.clone(provider);
        options.clientId = settings.clientId;
        options.clientSecret = settings.clientSecret;
        options.endpoint = settings.endpoint;

        return OAuth.v2(name, options);
    }
};