// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://foursquare.com/oauth2/authenticate',
        token: 'https://foursquare.com/oauth2/access_token',
        profile: function (credentials, params, get, callback) {

            var query = {
                v: '20140701',
                oauth_token: credentials.token
            };

            get('https://api.foursquare.com/v2/users/self', query, function (data) {

                var profile = data.response.user;

                credentials.profile = {
                    id: profile.id,
                    displayName: profile.firstName + ' ' + profile.lastName,
                    name: {
                        first: profile.firstName,
                        last: profile.lastName
                    },
                    email: profile.contact.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};