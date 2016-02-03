'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://api.twitch.tv/kraken/oauth2/authorize',
        token: 'https://api.twitch.tv/kraken/oauth2/token',
        scope: ['user_read'],
        scopeSeparator: ' ',
        profile: function (credentials, params, get, callback) {

            const queryOptions = {
                oauth_token: params.access_token
            };

            get('https://api.twitch.tv/kraken/user', queryOptions, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
