'use strict';

const Crypto = require('crypto');

exports = module.exports = function () {

    const baseUrl = 'https://public-api.wordpress.com/';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `${baseUrl}oauth2/authorize`,
        token: `${baseUrl}oauth2/token`,
        scope: ['global'],
        profile: function (credentials, params, get, callback) {

            const query = {
                format: 'json',
                token: credentials.token,
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };

            credentials.profile = {};

            get(`${baseUrl}rest/v1.1/me`, query, (profile) => {

                credentials.profile.id = profile.ID;
                credentials.profile.username = profile.username;
                credentials.profile.displayName = profile.display_name;
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};
