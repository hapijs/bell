// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    options = options || {};

    return {
        protocol: 'oauth2',
        auth: 'https://api.instagram.com/oauth/authorize',
        token: 'https://api.instagram.com/oauth/access_token',
        scope: ['basic'],
        scopeSeparator: ' ',
        profile: function (credentials, params, get, callback) {

            credentials.profile = {
                id: params.user.id,
                username: params.user.username,
                displayName: params.user.full_name,
                raw: params.user
            };

            if (options.extendedProfile === false) { // Defaults to true
                return callback();
            }

            get('https://api.instagram.com/v1/users/self', {access_token: credentials.token}, function (profile) {

                credentials.profile.raw = profile.data;
                return callback();
            });
        }
    };
};