// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://accounts.google.com/o/oauth2/auth',
        token: 'https://accounts.google.com/o/oauth2/token',
        scope: ['openid', 'email'],
        profile: function (credentials, params, get, callback) {

            get('https://www.googleapis.com/oauth2/v1/userinfo', null, function (profile) {

                credentials.profile = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.name,
                    name: {
                        first: profile.given_name,
                        last: profile.family_name
                    },
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
