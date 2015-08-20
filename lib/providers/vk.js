// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://oauth.vk.com/authorize',
        token: 'https://oauth.vk.com/access_token',
        profile: function (credentials, params, get, callback) {

            var query = {
                uids: params.user_id,
                access_token: params.access_token
            };

            get('https://api.vk.com/method/users.get', query, function (data) {

                var profile = data.response[0];
                credentials.profile = {
                    id: profile.uid,
                    displayName: profile.first_name + ' ' + profile.last_name,
                    name: {
                        first: profile.first_name,
                        last: profile.last_name
                    },
                    raw: profile
                };

                return callback();
            });
        }
    };
};
