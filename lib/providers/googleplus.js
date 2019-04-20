'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://www.googleapis.com/oauth2/v4/token',
        scope: ['profile', 'email'],
        profile: async function (credentials, params, get) {

            const profile = await get('https://www.googleapis.com/plus/v1/people/me');

            credentials.profile = {
                id: profile.id,
                displayName: profile.displayName,
                name: profile.name,
                emails: profile.emails,
                raw: profile
            };
        }
    };
};
