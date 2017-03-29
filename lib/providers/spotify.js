'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://accounts.spotify.com';
    const user = options.uri ? options.uri + '/v1/me' : 'https://api.spotify.com/v1/me';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: uri + '/authorize',
        token: uri + '/api/token',
        scope: ['user-read-email'],
        scopeSeparator: ',',
        headers: { 'User-Agent': 'hapi-bell-spotify' },
        profile: function (credentials, params, get, callback) {

            get(user, null, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    username: profile.id,
                    displayName: profile.display_name,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
