'use strict';

const internals = {};


exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://gitlab.com';
    const user = uri + '/api/v3/user';

    return {
        protocol: 'oauth2',
        auth: uri + '/oauth/authorize',
        token: uri + '/oauth/token',
        profile: async function (credentials, params, get) {

            const profile = await get(user);
            credentials.profile = profile;
        }
    };
};
