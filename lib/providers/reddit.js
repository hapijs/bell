'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: false,
        auth: 'https://www.reddit.com/api/v1/authorize',
        token: 'https://www.reddit.com/api/v1/access_token',
        scope: ['identity'], // minimal scope to request
        scopeSeparator: ' ',
        headers: {
            'User-Agent': 'hapi-bell-reddit'
        },
        profile: async function (credentials, params, get) {

            const queryOptions = {
                access_token: credentials.token,
                client_id: this.clientId
            };

            const profile = await get('https://oauth.reddit.com/api/v1/me', queryOptions);
            credentials.profile = profile;
        }
    };
};
