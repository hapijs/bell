'use strict';

const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');

const OAuth = require('./oauth');
const Providers = require('./providers');


const internals = {
    simulate: false,
    flexBoolean: Joi.boolean().truthy('true', 'yes', 1, '1').falsy('false', 'no', 0, '0')
};


// Utilities

exports.providers = Providers;

exports.oauth = OAuth;


// Plugin

exports.plugin = {
    name: 'bell',
    pkg: require('../package.json'),
    requirements: {
        hapi: '>=18.3.0'
    },

    register: function (server, options) {

        server.auth.scheme('bell', internals.implementation);
        server.expose('oauth', OAuth);
    }
};


internals.provider = Joi.object({
    name: Joi.string().optional().default('custom'),
    protocol: ['oauth', 'oauth2'],
    auth: Joi.string().required(),
    token: Joi.string().required(),
    headers: Joi.object(),
    profile: Joi.func(),
    profileMethod: Joi.valid('get', 'post').default('get')
})
    .when('.protocol', {
        is: 'oauth',
        then: Joi.object({
            temporary: Joi.string().required(),
            signatureMethod: Joi.valid('HMAC-SHA1', 'RSA-SHA1').default('HMAC-SHA1')
        }),
        otherwise: Joi.object({
            scope: Joi.alternatives(
                Joi.array().items(Joi.string()),
                Joi.func()
            ),
            scopeSeparator: Joi.string(),
            useParamsAuth: internals.flexBoolean.default(false),
            pkce: ['S256', 'plain']
        })
    });


internals.schema = Joi.object({
    provider: internals.provider.required(),

    password: Joi.string().required(),

    clientId: Joi.string().required(),

    clientSecret: Joi.alternatives()
        .try(Joi.string().allow(''))
        .conditional('provider.protocol', {
            not: 'oauth',
            then: Joi.object()
        })
        .required(),

    cookie: Joi.string(),

    isSameSite: Joi.valid('Strict', 'Lax').allow(false).default('Strict'),

    isSecure: internals.flexBoolean,

    isHttpOnly: internals.flexBoolean,

    ttl: Joi.number(),

    domain: Joi.string().allow(null),

    providerParams: Joi.alternatives(Joi.object(), Joi.func()),

    allowRuntimeProviderParams: internals.flexBoolean.default(false),

    scope: Joi.alternatives(
        Joi.array().items(Joi.string()),
        Joi.func()
    )
        .when('provider.protocol', { is: 'oauth2', otherwise: Joi.forbidden() }),

    name: Joi.string().required(),

    config: Joi.object(),

    profileParams: Joi.object(),

    skipProfile: internals.flexBoolean.optional().default(false),

    forceHttps: internals.flexBoolean.optional().default(false),

    location: Joi.alternatives(
        Joi.func().maxArity(1),
        Joi.string()
    )
        .default(false),

    runtimeStateCallback: Joi.func().optional()
});


internals.implementation = function (server, options) {

    let settings = Hoek.clone(options, { shallow: 'provider' });      // Options can be reused

    // Lookup provider

    if (typeof settings.provider === 'object') {
        settings.name = settings.provider.name || 'custom';
    }
    else {
        settings.name = settings.provider;
        settings.provider = Providers[settings.provider].call(null, settings.config);
    }

    const results = internals.schema.validate(settings);
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
        isSameSite: settings.isSameSite,
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
