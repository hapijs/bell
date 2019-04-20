'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.live.com/oauth20_authorize.srf',
        token: 'https://login.live.com/oauth20_token.srf',
        scope: ['wl.basic', 'wl.emails'],
        profile: async function (credentials, params, get) {

            const profile = await get('https://apis.live.net/v5.0/me');

            credentials.profile = {
                id: profile.id,
                username: profile.username,
                displayName: profile.name,
                name: {
                    first: profile.first_name,
                    last: profile.last_name
                },
                email: profile.emails && (profile.emails.preferred || profile.emails.account),
                raw: profile
            };
        }
    };
};
