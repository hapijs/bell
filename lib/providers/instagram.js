'use strict';

const internals = {};


exports = module.exports = function (options) {

    options = options || {};

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://api.instagram.com/oauth/authorize',
        token: 'https://api.instagram.com/oauth/access_token',
        scope: ['basic'],
        scopeSeparator: ' ',
        profile: async function (credentials, params, get) {

            credentials.profile = {
                id: params.user.id,
                username: params.user.username,
                displayName: params.user.full_name,
                raw: params.user
            };

            if (options.extendedProfile === false) { // Defaults to true
                return;
            }

            const profile = await get('https://api.instagram.com/v1/users/self', { access_token: credentials.token });
            credentials.profile.raw = profile.data;
        }
    };
};
