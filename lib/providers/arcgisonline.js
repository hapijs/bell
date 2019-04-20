'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.arcgis.com/sharing/rest/oauth2/authorize',
        token: 'https://www.arcgis.com/sharing/rest/oauth2/token',
        scope: [],
        profile: async function (credentials, params, get) {

            const query = {
                token: params.access_token,
                f: 'json'
            };

            const profile = await get('https://www.arcgis.com/sharing/rest/community/self', query);

            credentials.profile = {
                provider: 'arcgisonline',
                orgId: profile.orgId,
                username: profile.username,
                displayName: profile.fullName,
                name: {
                    first: profile.firstName,
                    last: profile.lastName
                },
                email: profile.email,
                role: profile.role,
                raw: profile
            };
        }
    };
};
