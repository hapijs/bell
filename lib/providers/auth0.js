'use strict';

// Load modules

const Joi = require('joi');


// Declare internals

const internals = {
    schema: Joi.object({
        domain: Joi.string().hostname().required()
    })
};


exports = module.exports = function (options) {

    const settings = Joi.attempt(options, internals.schema);
    const auth0BaseUrl = `https://${settings.domain}`;

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `${auth0BaseUrl}/authorize`,
        token: `${auth0BaseUrl}/oauth/token`,
        profile: async function (credentials, params, get) {

            const profile = await get(`${auth0BaseUrl}/userinfo`);          // https://auth0.com/docs/user-profile/normalized
            credentials.profile = {
                id: profile.user_id,
                email: profile.email,
                displayName: profile.name,
                name: {
                    first: profile.given_name,
                    last: profile.family_name
                },
                raw: profile
            };
        }
    };
};
