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
        signatureMethod: Joi.string().valid('HMAC-SHA1', 'RSA-SHA1').when('protocol', { is: 'oauth', then: Joi.default('HMAC-SHA1'), otherwise: Joi.forbidden() }),
        auth: Joi.string().required(),
        useParamsAuth: internals.flexBoolean.default(false).when('protocol', { is: 'oauth2', then: Joi.optional(), otherwise: Joi.forbidden() }),
        token: Joi.string().required(),
        headers: Joi.object(),
        profile: Joi.func(),
        scope: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.func()
        ).when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
        scopeSeparator: Joi.string().when('protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),
        version: Joi.string()
    }).required(),
    password: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required().allow(''),
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
    location: Joi.string().optional().default(false),
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
        isSameSite: false,
        ttl: settings.ttl,
        domain: settings.domain,
        ignoreErrors: true,
        clearInvalid: true
    };

    settings.cookie = settings.cookie || 'bell-' + settings.name;
    try {
        server.state(settings.cookie, cookieOptions);
    }
    catch (exception) {
        /* $lab:coverage:off$ */
        // This is to support Hapi 13.5.0 so that adding isSameSite: false option is not a breaking change
        if (exception.message.indexOf('isSameSite') === -1) {
            throw exception;
        }
        delete cookieOptions.isSameSite;
        server.state(settings.cookie, cookieOptions);
        /* $lab:coverage:on$ */
    }

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
        authenticate: function (request, reply) {

            internals.simulate(request, (err, result) => {

                if (err) {
                    return reply(err);
                }

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

                return reply.continue({ credentials: Hoek.applyToDefaults(credentials, result) });
            });
        }
    };
};
