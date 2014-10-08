// Load modules

var Hoek = require('hoek');
var Boom = require('boom');
var Joi = require('joi');
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


exports.providers = Providers;


internals.schema = Joi.object({
    provider: Joi.object({
        name: Joi.string().optional().default("custom"),
        protocol: Joi.string().valid('oauth', 'oauth2'),
        temporary: Joi.string().when('protocol', { is: 'oauth', then: Joi.required(), otherwise: Joi.forbidden() }),
        auth: Joi.string().required(),
        token: Joi.string().required(),
        headers: Joi.object(),
        profile: Joi.func(),
        scope: Joi.array().includes(Joi.string()).when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
        scopeSeparator: Joi.string().when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
        version: Joi.string()
    }).required(),
    password: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required().allow(''),
    cookie: Joi.string(),
    isSecure: Joi.boolean(),
    isHttpOnly: Joi.boolean(),
    ttl: Joi.number(),
    domain: Joi.string(),
    providerParams: Joi.object(),
    scope: Joi.array().includes(Joi.string()).when('provider.protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
    name: Joi.string().required(),
    config: Joi.object(),
    profileParams: Joi.object()
});


internals.implementation = function (server, options) {

    var settings = Hoek.cloneWithShallow(options, 'provider');      // Options can be reused

    // Lookup provider

    if (typeof settings.provider === 'object') {
        settings.name = settings.provider.name || 'custom';
    }
    else {
        settings.name = settings.provider;
        settings.provider = Providers[settings.provider].call(null, settings.config)
    }

    Joi.assert(settings, internals.schema);

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

    return { authenticate: (settings.provider.protocol === 'oauth' ? OAuth.v1 : OAuth.v2)(settings) };
};
