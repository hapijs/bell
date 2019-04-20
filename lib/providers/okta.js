'use strict';

const Joi = require('@hapi/joi');


const internals = {
    schema: Joi.object({
        uri: Joi.string().uri().required()
    }).required()
};


exports = module.exports = function (options) {

    const settings = Joi.attempt(options, internals.schema);

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: settings.uri + '/oauth2/v1/authorize',
        token: settings.uri + '/oauth2/v1/token',
        scope: ['profile', 'openid', 'email', 'offline_access'],
        profile: async function (credentials, params, get) {

            const profile = await get(settings.uri + '/oauth2/v1/userinfo');

            credentials.profile = {
                id: profile.sub,
                username: profile.email,
                displayName: profile.nickname,
                firstName: profile.given_name,
                lastName: profile.family_name,
                email: profile.email,
                raw: profile
            };
        }
    };
};
