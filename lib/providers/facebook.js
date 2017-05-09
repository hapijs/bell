'use strict';

// Load modules

const Crypto = require('crypto');


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.facebook.com/v2.9/dialog/oauth',
        token: 'https://graph.facebook.com/v2.9/oauth/access_token',
        scope: ['email'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {

            const query = {
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex'),
                fields: 'id,name,email,first_name,last_name,middle_name,gender,link,locale,timezone,updated_time,verified'
            };

            get('https://graph.facebook.com/v2.9/me', query, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.name,
                    name: {
                        first: profile.first_name,
                        last: profile.last_name,
                        middle: profile.middle_name
                    },
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
