// Load modules

var Crypto = require('crypto');

// Declare internals

var internals = {};


exports = module.exports = function (options) {

    var uri = options.uri || 'https://api.linkedin.com/v1/people/~';

    return {
        protocol: 'oauth2',
        auth: 'https://www.linkedin.com/uas/oauth2/authorization',
        token: 'https://www.linkedin.com/uas/oauth2/accessToken',
        scope: ['r_fullprofile', 'r_emailaddress', 'r_contactinfo'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {
            var query = {
            format: 'json',
            appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };
            get(uri, query, function (profile) {
                credentials.profile = profile;
                return callback();
                });
        }
    };
};