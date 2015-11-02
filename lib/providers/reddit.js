'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: false,
        auth: 'https://www.reddit.com/api/v1/authorize',
        token: 'https://www.reddit.com/api/v1/access_token',
        scope: ['identity'], // minimal scope to request
        scopeSeparator: ' ',
        headers: { 'User-Agent': 'hapi-bell-reddit' },
        profile: function (credentials, params, get, callback) {

            const queryOptions = {
                access_token: credentials.token,
                client_id: this.clientId
            };

            get('https://oauth.reddit.com/api/v1/me', queryOptions, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
