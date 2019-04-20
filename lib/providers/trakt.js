'use strict';

const Hoek = require('@hapi/hoek');


const internals = {};


exports = module.exports = function (options) {

    options = options || {};
    Hoek.assert(options.apiKey, 'The property "apiKey" is required for the trakt.tv bell provider');

    const uri = 'https://api.trakt.tv';
    const user = uri + '/users/me';

    return {
        protocol: 'oauth2',
        auth: uri + '/oauth/authorize',
        token: uri + '/oauth/token',
        headers: {
            'trakt-api-version': 2,
            'trakt-api-key': options.apiKey
        },
        profile: async function (credentials, params, get) {

            const query = {
                extended: 'full'
            };

            const profile = await get(user, query);
            credentials.profile = profile;
        }
    };
};
