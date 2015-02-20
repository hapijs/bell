// Load modules
var Hoek = require('hoek');

// Declare internals
var internals = {};

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://api.twitch.tv/kraken/oauth2/authorize',
        token: 'https://api.twitch.tv/kraken/oauth2/token',
        scope: [ 'user_read' ],
        profile: function(credentials, params, get, callback) {

            // twitch requires 'OAuth' instead of 'Bearer'
            var twOptions = {
                headers: {
                    Authorization: 'OAuth ' + params.access_token
                }
            };
            Hoek.merge(this.provider, twOptions);

            get('https://api.twitch.tv/kraken/user', {}, function( profile ) {

                credentials.profile = profile;
                callback(credentials);
            })
        }
    }
}
