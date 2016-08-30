'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://www.googleapis.com/oauth2/v4/token',
        scope: ['profile', 'email'],
        profile: function (credentials, params, get, callback) {

            get('https://www.googleapis.com/oauth2/v3/userinfo', null, (profile) => {

                credentials.profile = {
                    id: profile.sub,
                    displayName: profile.name,
                    name: {
                        given_name: profile.given_name,
                        family_name: profile.family_name
                    },
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
