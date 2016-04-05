'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scope: ['openid','offline_access', 'profile'],
        profile: function (credentials, params, get, reply) {

            get('https://outlook.office.com/api/v2.0/me', null, (profile) => {

                credentials.profile = {
                    id: profile.Id,
                    displayName: profile.DisplayName,
                    email: profile.EmailAddress,
                    raw: profile
                };
                return reply();
            });
        }
    };
};
