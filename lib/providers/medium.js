'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://medium.com/m/oauth/authorize',
        token: 'https://medium.com/v1/tokens',
        scope: ['basicProfile'],
        scopeSeparator: ',',
        headers: { 'User-Agent': 'hapi-bell-medium' },
        profile: function (credentials, params, get, callback) {

            get('https://api.medium.com/v1/me', null, (profile) => {

                credentials.profile = {
                    id: profile.data.id,
                    username: profile.data.username,
                    displayName: profile.data.name,
                    raw: profile.data
                };

                return callback();
            });
        }
    };
};
