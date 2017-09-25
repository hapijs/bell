'use strict';

exports = module.exports = function (options) {

    options = options || {};
    const tenantId = options.tenant || 'common';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/authorize',
        token: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/token',
        scope: ['openid','offline_access', 'profile'],
        profile: function (credentials, params, get, reply) {

            get('https://login.microsoftonline.com/' + tenantId + '/openid/userinfo', null, (profile) => {

                credentials.profile = {
                    id: profile.oid,
                    displayName: profile.name,
                    email: profile.upn || profile.email,
                    raw: profile
                };
                return reply();
            });
        }
    };
};
