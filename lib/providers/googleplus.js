'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://www.googleapis.com/oauth2/v4/token',
        scope: ['profile', 'email'],
        profile: function (credentials, params, get, callback) {

            get('https://www.googleapis.com/plus/v1/people/me', null, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    displayName: profile.displayName,
                    name: profile.name,
                    emails: profile.emails,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
