'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://oauth.vk.com/authorize',
        token: 'https://oauth.vk.com/access_token',
        profile: function (credentials, params, get, callback) {

            const query = {
                uids: params.user_id,
                access_token: params.access_token
            };

            get('https://api.vk.com/method/users.get', query, (data) => {

                const profile = data.response[0];
                credentials.profile = {
                    id: profile.uid,
                    displayName: profile.first_name + ' ' + profile.last_name,
                    name: {
                        first: profile.first_name,
                        last: profile.last_name
                    },
                    raw: profile
                };

                // If we use 'email' permission at scope, we'll get it on https://oauth.vk.com/access_token request only.
                // There is no way to get email on https://api.vk.com/method/users.get request.
                if (params.email) {
                    credentials.profile.email = params.email;
                }

                return callback();
            });
        }
    };
};
