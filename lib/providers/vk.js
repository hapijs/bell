// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://oauth.vk.com/authorize',
        token: 'https://oauth.vk.com/access_token',
        scope: ['email'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {

            get('https://api.vk.com/method/users.get', { user_ids: params.user_id }, function (profile) {

                credentials.profile = {
                    id: params.user_id,
                    email: params.email,
                    username: profile.response[0].first_name + ' ' + profile.response[0].last_name,
                    raw: profile.response
                };

                return callback();
            });
        }
    };
};
