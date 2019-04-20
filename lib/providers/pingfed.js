'use strict';

const internals = {};


exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://login-dev.ext.hpe.com';

    return {
        protocol: 'oauth2',
        auth: uri + '/as/authorization.oauth2',
        token: uri + '/as/token.oauth2',
        scope: ['openid', 'email'],
        scopeSeparator: ' ',
        useParamsAuth: true,
        profile: async function (credentials, params, get) {

            const profile = await get(uri + '/idp/userinfo.openid');

            credentials.profile = {
                id: profile.sub,
                username: profile.email,
                displayName: profile.email,
                email: profile.email,
                raw: profile
            };
        }
    };
};
