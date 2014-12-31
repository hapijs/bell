var Hoek = require('hoek');
var url = 'https://api.twitch.tv/kraken/';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: url + 'oauth2/authorize',
        token: url + 'oauth2/token',
        scope: [ 'user_read' ],
        profile: function(credentials, params, get, callback) {

            // twitch requires 'OAuth' instead of 'Bearer'
            var twOptions = {
                headers: {
                    Authorization: 'OAuth ' + params.access_token
                }
            };
            Hoek.merge(this.provider, twOptions);

            get(url + 'user', {}, function(body) {
                credentials.profile = body;
                callback(credentials);
            })
        }
    }
}
