'use strict';

const internals = {};


exports = module.exports = function (options) {

    options = options || {};
    const tenantId = options.tenant || 'common';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/authorize',
        token: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/token',
        scope: ['openid', 'offline_access', 'profile'],
        profile: async function (credentials, params, get) {

            const profile = await get('https://login.microsoftonline.com/' + tenantId + '/openid/userinfo');

            credentials.profile = {
                id: profile.oid,
                displayName: profile.name,
                email: profile.upn || profile.email,
                raw: profile
            };
        }
    };
};
