'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://mixer.com/oauth/authorize',
        token: 'https://mixer.com/api/v1/oauth/token',
        scope: ['user:details:self'],
        scopeSeparator: ' ',
        profile: function (credentials, params, get, callback) {

            const queryOptions = {
                oauth_token: params.access_token
            };

            get('https://mixer.com/api/v1/users/current', queryOptions, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
