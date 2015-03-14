// Load modules

var Crypto = require('crypto');

// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://www.linkedin.com/uas/oauth2/authorization',
        token: 'https://www.linkedin.com/uas/oauth2/accessToken',
        scope: ['r_fullprofile', 'r_emailaddress', 'r_network', 'r_contactinfo', 'rw_groups'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {
            var query = {
            format: 'json',
            appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };
            get('https://api.linkedin.com/v1/people/~:(id,first-name,last-name,industry,associations,interests,publications,patents,languages,skills,educations,three-current-positions,num-recommenders,following,suggestions)', query, function (profile) {

                credentials.profile = profile;
                return callback();
                });
        }
    };
};
