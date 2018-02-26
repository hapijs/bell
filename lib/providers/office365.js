'use strict';

// Load modules


// Declare internals

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scope: ['openid', 'offline_access', 'profile'],
        profile: async function (credentials, params, get) {

            const profile = await get('https://outlook.office.com/api/v2.0/me');

            credentials.profile = {
                id: profile.Id,
                displayName: profile.DisplayName,
                email: profile.EmailAddress,
                raw: profile
            };
        }
    };
};
