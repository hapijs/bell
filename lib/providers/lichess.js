'use strict';

const internals = {};


exports = module.exports = function (options) {
    return {
        protocol: 'oauth2',
        auth: 'https://lichess.org/oauth',
        token: 'https://lichess.org/api/token',
        pkce: 'S256',
        useParamsAuth: true,
        profile: async function (credentials, params, get) {

            const profile = await get('https://lichess.org/api/account');

            credentials.profile = {
                id: profile.id,
                displayName: profile.username,
                username: profile.username,
                profileUrl: 'https://lichess.org/@/' + profile.username,
                raw: profile
            };
        }
    };
};
