'use strict';

const Joi = require('joi');


const internals = {
    schema: Joi.object({
        uri: Joi.string().uri().required(),
        authorizationServerId: Joi.string().alphanum()
    }).required()
};


exports = module.exports = function (options) {

    const settings = Joi.attempt(options, internals.schema);

    let baseUri = settings.uri + '/oauth2';
    if (settings.authorizationServerId) {
        baseUri += '/' + settings.authorizationServerId;
    }

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: baseUri + '/v1/authorize',
        token: baseUri + '/v1/token',
        scope: ['profile', 'openid', 'email', 'offline_access'],
        profile: async function (credentials, params, get) {

            const profile = await get(baseUri + '/v1/userinfo');

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
