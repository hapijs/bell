'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const OAuth = require('./oauth');
const Providers = require('./providers');


// Declare internals

const internals = {
    simulate: false,
    flexBoolean: Joi.boolean().truthy('true', 'yes', 1, '1').falsy('false', 'no', 0, '0')
};


// Utilities

exports.providers = Providers;
exports.oauth = OAuth;


// Plugin

exports.plugin = {
    pkg: require('../package.json'),

    register: function (server, options) {

        server.auth.scheme('bell', internals.implementation);
        server.expose('oauth', OAuth);
    }
};


internals.schema = Joi.object({
    provider: Joi.object({
        name: Joi.string().optional().default('custom'),
        protocol: Joi.string().valid('oauth', 'oauth2'),
        temporary: Joi.string().when('protocol', { is: 'oauth', then: Joi.required(), otherwise: Joi.forbidden() }),
        signatureMethod: Joi.string().valid('HMAC-SHA1', 'RSA-SHA1').when('protocol', { is: 'oauth', then: Joi.default('HMAC-SHA1'), otherwise: Joi.forbidden() }),
        auth: Joi.string().required(),
        useParamsAuth: internals.flexBoolean.default(false).when('protocol', { is: 'oauth2', then: Joi.optional(), otherwise: Joi.forbidden() }),
        token: Joi.string().required(),
        headers: Joi.object(),
        profile: Joi.func(),
        profileMethod: Joi.string().valid('get', 'post').default('get'),
        scope: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.func()
        ).when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
        scopeSeparator: Joi.string().when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() })
    }).required(),
    password: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.alternatives().when('protocol', {
        is: 'oauth',
        then: Joi.string().required().allow(''),
        otherwise: Joi.alternatives().try(Joi.string().allow(''), Joi.object())
    }).required(),
    cookie: Joi.string(),
    isSecure: internals.flexBoolean,
    isHttpOnly: internals.flexBoolean,
    ttl: Joi.number(),
    domain: Joi.string().allow(null),
    providerParams: Joi.alternatives().try(Joi.object(), Joi.func()),
    allowRuntimeProviderParams: internals.flexBoolean.default(false),
    scope: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.func()
    ).when('provider.protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
    name: Joi.string().required(),
    config: Joi.object(),
    profileParams: Joi.object(),
    skipProfile: internals.flexBoolean.optional().default(false),
    forceHttps: internals.flexBoolean.optional().default(false),
    location: Joi.alternatives().try(
        Joi.func().maxArity(1),
        Joi.string()
    ).default(false),
    runtimeStateCallback: Joi.func().optional()
});


internals.implementation = function (server, options) {

    let settings = Hoek.cloneWithShallow(options, 'provider');      // Options can be reused

    // Lookup provider

    if (typeof settings.provider === 'object') {
        settings.name = settings.provider.name || 'custom';
    }
    else {
        settings.name = settings.provider;
        settings.provider = Providers[settings.provider].call(null, settings.config);
    }

    const results = Joi.validate(settings, internals.schema);
    Hoek.assert(!results.error, results.error);

    // Passed validation, use Joi converted settings

    settings = results.value;

    // Setup cookie for managing temporary authorization state

    const cookieOptions = {
        encoding: 'iron',
        path: '/',
        password: settings.password,
        isSecure: settings.isSecure !== false,                  // Defaults to true
        isHttpOnly: settings.isHttpOnly !== false,              // Defaults to true
        isSameSite: 'Strict',
        ttl: settings.ttl,
        domain: settings.domain,
        ignoreErrors: true,
        clearInvalid: true
    };

    settings.cookie = settings.cookie || 'bell-' + settings.name;
    server.state(settings.cookie, cookieOptions);

    if (internals.simulate) {
        return internals.simulated(settings);
    }

    return { authenticate: (settings.provider.protocol === 'oauth' ? OAuth.v1 : OAuth.v2)(settings) };
};


exports.simulate = function (credentialsFunc) {

    internals.simulate = credentialsFunc;
};


internals.simulated = function (settings) {

    const name = settings.name;
    const protocol = settings.provider.protocol;

    return {
        authenticate: async function (request, h) {

            const result = await internals.simulate(request);

            const credentials = {
                provider: name,
                token: 'oauth_token',
                query: request.query
            };

            if (protocol === 'oauth') {
                credentials.secret = 'token_secret';
            }
            else {
                credentials.refreshToken = 'refresh_token';
                credentials.expiresIn = 3600;
            }

            return h.authenticated({ credentials: Hoek.applyToDefaults(credentials, result) });
        }
    };
};
