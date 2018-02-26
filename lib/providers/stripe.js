'use strict';

// Load modules


// Declare internals

const internals = {};


exports = module.exports = () => {

    const domain = 'connect.stripe.com';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `https://${domain}/oauth/authorize`,
        token: `https://${domain}/oauth/token`,
        scope: ['read_only'],
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
