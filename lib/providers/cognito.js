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
        auth: settings.uri + '/oauth2/authorize',
        token: settings.uri + '/oauth2/token',
        scope: ['openid', 'email', 'profile'],
        scopeSeparator: ' ',
        useParamsAuth: true,
        profile: async function (credentials, params, get) {

            const profile = await get(settings.uri + '/oauth2/userInfo');

            credentials.profile = {
                id: profile.sub,
                username: profile.preferred_username,
                displayName: profile.name,
                firstName: profile.given_name,
                lastName: profile.family_name,
                email: profile.email,
                raw: profile
            };
        }
    };
};
