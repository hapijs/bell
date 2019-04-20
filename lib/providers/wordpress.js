'use strict';

const Crypto = require('crypto');


const internals = {};


exports = module.exports = function () {

    const baseUrl = 'https://public-api.wordpress.com/';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `${baseUrl}oauth2/authorize`,
        token: `${baseUrl}oauth2/token`,
        scope: ['global'],
        profile: async function (credentials, params, get) {

            const query = {
                format: 'json',
                token: credentials.token,
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };

            const profile = await get(`${baseUrl}rest/v1.1/me`, query);

            credentials.profile = {};
            credentials.profile.id = profile.ID;
            credentials.profile.username = profile.username;
            credentials.profile.displayName = profile.display_name;
            credentials.profile.raw = profile;
        }
    };
};
