'use strict';

const Joi = require('@hapi/joi');


const internals = {
    schema: Joi.object({
        express: Joi.boolean().optional()
    }).optional()
};


exports = module.exports = (options = {}) => {

    const settings = Joi.attempt(options, internals.schema);
    const domain = 'connect.stripe.com';
    const authPrefix = settings.express ? '/express' : '';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `https://${domain}${authPrefix}/oauth/authorize`,
        token: `https://${domain}/oauth/token`,
        scope: [],
        headers: { 'User-Agent': 'hapi-bell-stripe' },
        profile: async function (credentials, params, get) {

            const user = `https://${credentials.token}@${domain}/v1/account`;

            const profile = await get(user);
            credentials.profile = {
                id: profile.id,
                legalName: profile.business_name,
                displayName: profile.display_name,
                email: profile.email,
                raw: profile
            };
        }
    };
};
