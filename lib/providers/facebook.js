// Load modules

var Crypto = require('crypto');


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://graph.facebook.com/oauth/authorize',
        token: 'https://graph.facebook.com/oauth/access_token',
        scope: ['email'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {

            var query = {
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };

            get('https://graph.facebook.com/me', query, function (profile) {

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