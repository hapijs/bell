// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    options = options || {};

    return {
        protocol: 'oauth',
        temporary: 'https://www.tumblr.com/oauth/request_token',
        auth: 'https://www.tumblr.com/oauth/authorize',
        token: 'https://www.tumblr.com/oauth/access_token',
        profile: function (credentials, params, get, callback) {

            credentials.profile = {
                id: params.user_id,
                username: params.screen_name
            };

            if (options.extendedProfile === false) {      // Defaults to true
                return callback();
            }

            get('https://api.tumblr.com/v2/user/info', {}, function (profile) {

                credentials.profile.displayName = profile.name;
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};
