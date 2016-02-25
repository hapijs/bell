'use strict';

exports = module.exports = function (options) {

    options = options || {};
    const auth0BaseUrl = `https://${options.domain}`;
    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `${auth0BaseUrl}/authorize`,
        token: `${auth0BaseUrl}/oauth/token`,
        profile: function (credentials, params, get, callback) {

            get(`${auth0BaseUrl}/userinfo`, null, (profile) => {
                // https://auth0.com/docs/user-profile/normalized
                credentials.profile = {
                    id: profile.user_id,
                    email: profile.email,
                    displayName: profile.name,
                    name: {
                        first: profile.given_name,
                        last: profile.family_name
                    },
                    raw: profile
                };
                callback();
            });
        }
    };
};
