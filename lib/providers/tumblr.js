// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth',
        temporary: 'https://www.tumblr.com/oauth/request_token',
        auth: 'https://www.tumblr.com/oauth/authorize',
        token: 'https://www.tumblr.com/oauth/access_token',
        profile: function (credentials, params, get, callback) {

            get('https://api.tumblr.com/v2/user/info', {}, function (profile) {

                credentials.profile = {
                    username: profile.response.user.name,
                    raw: profile.response.user
                };
                return callback();
            });
        }
    };
};
