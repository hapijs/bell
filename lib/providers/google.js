'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const extractProfile = function (profile, profileUrl) {

        let ret;
        if (profileUrl.indexOf('plus') === -1) {
            //standard google profile information
            ret = Object.assign({}, {
                displayName: profile.name,
                name: {
                    given_name: profile.given_name,
                    family_name: profile.family_name
                },
                email: profile.email
            });
        }
        else {
            //google plus profile information
            ret = Object.assign({}, {
                displayName: profile.displayName,
                name: profile.name,
                emails: profile.emails
            });
        }
        return Object.assign(ret, {
            id: profile.id,
            raw: profile
        });
    };

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://www.googleapis.com/oauth2/v4/token',
        scope: ['profile', 'email'],
        profile: function (credentials, params, get, callback) {

            const profileUrl = options.profileUrl || 'https://www.googleapis.com/plus/v1/people/me';
            get(profileUrl, null, (profile) => {

                credentials.profile = extractProfile(profile, profileUrl);
                return callback();
            });
        }
    };
};
