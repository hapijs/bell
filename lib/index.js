// Load modules

var Hoek = require('hoek');
var Joi = require('joi');
var OAuth = require('./oauth');
var Providers = require('./providers');


// Declare internals

var internals = {};


// Utilities

exports.providers = Providers;
exports.oauth = OAuth;


// Plugin

exports.register = function (server, options, next) {

    server.auth.scheme('bell', internals.implementation);
    server.expose('oauth', OAuth);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};


internals.schema = Joi.object({
    provider: Joi.object({
        name: Joi.string().optional().default('custom'),
        protocol: Joi.string().valid('oauth', 'oauth2'),
        temporary: Joi.string().when('protocol', { is: 'oauth', then: Joi.required(), otherwise: Joi.forbidden() }),
        auth: Joi.string().required(),
        useParamsAuth: Joi.boolean().default(false).when('protocol', { is: 'oauth2', then: Joi.optional(), otherwise: Joi.forbidden() }),
        token: Joi.string().required(),
        headers: Joi.object(),
        profile: Joi.func(),
        scope: Joi.array().items(Joi.string()).when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
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
    domain: Joi.string().allow(null),
    providerParams: Joi.object(),
    allowRuntimeProviderParams: Joi.boolean().default(false),
    scope: Joi.array().items(Joi.string()).when('provider.protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
    name: Joi.string().required(),
    config: Joi.object(),
    profileParams: Joi.object(),
    forceHttps: Joi.boolean().optional().default(false),
    location: Joi.string().optional().default(false)
});


internals.implementation = function (server, options) {

    var settings = Hoek.cloneWithShallow(options, 'provider');      // Options can be reused

    // Lookup provider

    if (typeof settings.provider === 'object') {
        settings.name = settings.provider.name || 'custom';
    }
    else {
        settings.name = settings.provider;
        settings.provider = Providers[settings.provider].call(null, settings.config);
    }

    var results = Joi.validate(settings, internals.schema);
    Hoek.assert(!results.error, results.error);

    // Passed validation, use Joi converted settings
    settings = results.value;

    // Setup cookie for managing temporary authorization state

    var cookieOptions = {
        encoding: 'iron',
        path: '/',
        password: settings.password,
        isSecure: settings.isSecure !== false,                  // Defaults to true
        isHttpOnly: settings.isHttpOnly !== false,              // Defaults to true
        ttl: settings.ttl,
        domain: settings.domain,
        ignoreErrors: true,
        clearInvalid: true
    };

    settings.cookie = settings.cookie || 'bell-' + settings.name;
    server.state(settings.cookie, cookieOptions);

    return { authenticate: (settings.provider.protocol === 'oauth' ? OAuth.v1 : OAuth.v2)(settings) };
};
