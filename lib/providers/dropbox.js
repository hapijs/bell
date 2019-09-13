'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.dropbox.com/oauth2/authorize',
        token: 'https://api.dropboxapi.com/oauth2/token',
        profileMethod: 'post',
        profile: async function (credentials, params, get) {

            const profile = await get('https://api.dropboxapi.com/2/users/get_current_account');
            credentials.profile = profile;
        }
    };
};
