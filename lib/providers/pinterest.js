'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        name: 'pinterest',
        protocol: 'oauth2',
        auth: 'https://api.pinterest.com/oauth/',
        token: 'https://api.pinterest.com/v1/oauth/token',
        useParamsAuth: true,
        scope: ['read_public', 'write_public', 'read_relationships', 'write_relationships'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                fields: 'id,username,first_name,last_name,bio,created_at,counts,image'
            };

            const profile = await get('https://api.pinterest.com/v1/me/', query);

            credentials.profile = {
                id: profile.data.id,
                username: profile.data.username,
                name: {
                    first: profile.data.first_name,
                    last: profile.data.last_name
                },
                raw: profile
            };
        }
    };
};
