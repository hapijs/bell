'use strict';

exports = module.exports = function () {

    const baseUrl = 'https://public-api.wordpress.com/';

    return {
        protocol: 'oauth2',
        auth: `${baseUrl}oauth2/authorize`,
        token: `${baseUrl}oauth2/token`,
        scope: ['global'],
        profile: function (credentials, params, get, callback) {

            credentials.profile = {};

            get(`${baseUrl}rest/v1.1/me`, { token: credentials.token }, (profile) => {

                credentials.profile.id = profile.ID;
                credentials.profile.username = profile.username;
                credentials.profile.displayName = profile.display_name;
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};
