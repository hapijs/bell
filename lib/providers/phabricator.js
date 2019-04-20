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
        auth: settings.uri + '/oauthserver/auth/',
        token: settings.uri + '/oauthserver/token/',
        scope: ['whoami'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                access_token: credentials.token
            };

            const profile = await get(settings.uri + '/api/user.whoami', query);

            credentials.profile = {
                id: profile.result.phid,
                username: profile.result.userName,
                displayName: profile.result.realName,
                email: profile.result.primaryEmail,
                raw: profile
            };
        }
    };
};
