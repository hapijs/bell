'use strict';

const internals = {};


// https://dev.twitch.tv/docs/authentication/#introduction

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://id.twitch.tv/oauth2/authorize',
        token: 'https://id.twitch.tv/oauth2/token',
        scope: ['user:read:email'],
        scopeSeparator: ' ',
        profile: async function (credentials, params, get) {

            // https://dev.twitch.tv/docs/api/reference/#get-users
            // Passing no args to the request gives authenticated user details

            const queryOptions = {};
            const profileResponse = await get('https://api.twitch.tv/helix/users', queryOptions);
            credentials.profile = profileResponse.data[0];
        }
    };
};
