// Load modules


// Declare internals

var internals = {};


exports = module.exports = {
    protocol: 'oauth',
    temporary: 'https://api.twitter.com/oauth/request_token',
    auth: 'https://api.twitter.com/oauth/authenticate',
    token: 'https://api.twitter.com/oauth/access_token',
    profile: function (credentials, params, get, callback) {

        credentials.profile = {
            id: params.user_id,
            username: params.screen_name
        };

        if (!this.settings.extendedProfile) {
            return callback();
        }

        get('https://api.twitter.com/1.1/users/show.json', { user_id: params.user_id }, function (err, payload) {

            if (err) {
                return callback(err);
            }

            credentials.profile.displayName = payload.name;
            credentials.profile.raw = payload;
            return callback();
        });
    }
};
