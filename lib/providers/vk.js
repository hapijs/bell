'use strict';

const internals = {};


exports = module.exports = function (options) {

    options = options || {};
    const version = options.version || '5.73';
    const key_id = parseInt(version) < 5 ? 'uid' : 'id';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://oauth.vk.com/authorize',
        token: 'https://oauth.vk.com/access_token',
        profile: async function (credentials, params, get) {

            const query = {
                uids: params.user_id,
                access_token: params.access_token,
                v: version
            };

            if (options.fields) {
                query.fields = options.fields;
            }

            const data = await get('https://api.vk.com/method/users.get', query);
            const profile = data.response[0];

            credentials.profile = {
                id: profile[key_id],
                displayName: profile.first_name + ' ' + profile.last_name,
                name: {
                    first: profile.first_name,
                    last: profile.last_name
                },
                raw: profile
            };
        }
    };
};
