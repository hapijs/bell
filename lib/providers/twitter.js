// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    options = options || {};

    return {
        protocol: 'oauth',
        temporary: 'https://api.twitter.com/oauth/request_token',
        auth: 'https://api.twitter.com/oauth/authenticate',
        token: 'https://api.twitter.com/oauth/access_token',
        profile: function (credentials, params, get, callback) {

            credentials.profile = {
                id: params.user_id,
                username: params.screen_name
            };

            if (options.extendedProfile === false) {      // Defaults to true
                return callback();
            }

            get('https://api.twitter.com/1.1/users/show.json', { user_id: params.user_id }, function (profile) {

                credentials.profile.displayName = profile.name;
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};