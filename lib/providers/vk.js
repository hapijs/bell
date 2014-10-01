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

            get('https://api.vk.com/method/users.get', { user_ids: params.user_id, fields: 'screen_name' }, function (profile) {

                profile = profile.response[0];

                if(profile.screen_name === 'id'+profile.uid)
                    profile.screen_name = profile.first_name + ' ' + profile.last_name

                credentials.profile = {
                    id: params.user_id,
                    email: params.email,
                    username: profile.screen_name,
                    raw: profile
                };
                
                return callback();
            });
        }
    };
};
