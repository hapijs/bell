'use strict';

const internals = {};


exports = module.exports = function () {

    return {
        protocol: 'oauth2',
        auth: 'https://bitbucket.org/site/oauth2/authorize',
        token: 'https://bitbucket.org/site/oauth2/access_token',
        profile: async function (credentials, params, get) {

            const profile = await get('https://api.bitbucket.org/2.0/user');

            credentials.profile = {
                id: profile.uuid,
                username: profile.username,
                displayName: profile.display_name,
                raw: profile
            };
        }
    };
};
