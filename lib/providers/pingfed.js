'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://login-dev.ext.hpe.com';

    return {
        protocol: 'oauth2',
        auth: uri + '/as/authorization.oauth2',
        token: uri + '/as/token.oauth2',
        scope: ['openid','email'],
        scopeSeparator: ' ',
        useParamsAuth: true,
        profile: function (credentials, params, get, callback) {

            const userUrl = uri + '/idp/userinfo.openid';

            get(userUrl, null, (profile) => {

                credentials.profile = {
                    id: profile.sub,
                    username: profile.email,
                    displayName: profile.email,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
