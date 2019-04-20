'use strict';

const internals = {};


exports = module.exports = function (options) {

    // According to the official docs, no user data is available via the Nest
    // OAuth service. Therefore, there is no `profile`.

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://home.nest.com/login/oauth2',
        token: 'https://api.home.nest.com/oauth2/access_token'
    };
};
