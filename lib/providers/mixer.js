'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://mixer.com';
    const user = options.uri ? options.uri + '/api/v1/users/current' : 'https://mixer.com/api/v1/users/current';

    return {
        protocol: 'oauth2',
        auth: uri + '/oauth/authorize',
        token: uri + '/api/v1/oauth/token',
        scope: ['user:details:self'],
        useParamsAuth: true,
        headers: { 'User-Agent': 'hapi-bell-mixer' },
        profile: function (credentials, params, get, callback) {

            get(user, null, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
