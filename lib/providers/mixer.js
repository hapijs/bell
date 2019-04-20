'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://mixer.com/oauth/authorize',
        token: 'https://mixer.com/api/v1/oauth/token',
        scope: ['user:details:self'],
        scopeSeparator: ' ',
        profile: async function (credentials, params, get) {

            const queryOptions = {
                oauth_token: params.access_token
            };

            const profile = await get('https://mixer.com/api/v1/users/current', queryOptions);
            credentials.profile = profile;
        }
    };
};
