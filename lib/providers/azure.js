'use strict';

const internals = {};


// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview

exports = module.exports = function (options) {

    options = options || {};
    const tenantId = options.tenant || 'common';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token',
        scope: [
            'openid',
            'offline_access',       // Enable app to get refresh_tokens
            'profile',              // Get basic info such as name, preferred username and objectId
            'user.read'             // Read basic user info through /me endpoint
        ],
        profile: async function (credentials, params, get) {

            // credentials: { provider, query, token, refreshToken, expiresIn }

            const profile = await get('https://graph.microsoft.com/v1.0/me');

            credentials.profile = {
                id: profile.id,
                displayName: profile.displayName,
                email: profile.userPrincipalName || profile.mail,
                raw: profile
            };
        }
    };
};
