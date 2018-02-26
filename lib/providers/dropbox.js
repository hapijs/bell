'use strict';

// Load modules


// Declare internals

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.dropbox.com/1/oauth2/authorize',
        token: 'https://api.dropbox.com/1/oauth2/token',
        profile: async function (credentials, params, get) {

            const profile = await get('https://api.dropbox.com/1/account/info');
            credentials.profile = profile;
        }
    };
};
