'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = 'https://api.trakt.tv';
    const user = uri + '/users/me';

    return {
        protocol: 'oauth2',
        auth: uri + '/oauth/authorize',
        token: uri + '/oauth/token',
        headers: {
            'trakt-api-version': 2,
            'trakt-api-key': options.apiKey
        },
        profile: function (credentials, params, get, callback) {

            const query = {
                extended: 'full'
            };

            get(user, query, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
