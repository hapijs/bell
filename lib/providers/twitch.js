'use strict';

// Load modules


// Declare internals

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://api.twitch.tv/kraken/oauth2/authorize',
        token: 'https://api.twitch.tv/kraken/oauth2/token',
        scope: ['user_read'],
        scopeSeparator: ' ',
        profile: async function (credentials, params, get) {

            const queryOptions = {
                oauth_token: params.access_token
            };

            const profile = await get('https://api.twitch.tv/kraken/user', queryOptions);
            credentials.profile = profile;
        }
    };
};
