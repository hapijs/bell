// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

        return {
        protocol: 'oauth2',
        auth: 'https://login.live.com/oauth20_authorize.srf',
        token: 'https://login.live.com/oauth20_token.srf',
        scope: ['wl.basic', 'wl.emails'],
        profile: function (credentials, params, get, callback) {

            get('https://apis.live.net/v5.0/me', null, function (profile) {

                credentials.profile = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.name,
                    name: {
                        first: profile.first_name,
                        last: profile.last_name,
                    },
                    email: profile.emails && (profile.emails.preferred || profile.emails.account),
                    raw: profile
                };

                return callback();
            });
        }
    };
};