'use strict';

exports = module.exports = function (options) {

    return {
        name: 'pinterest',
        protocol: 'oauth2',
        auth: 'https://api.pinterest.com/oauth/',
        token: 'https://api.pinterest.com/v1/oauth/token',
        useParamsAuth: true,
        scope: ['read_public', 'write_public', 'read_relationships', 'write_relationships'],
        scopeSeparator: ',',
        profile: function (credentials, params, get, callback) {

            const query = {
                fields: 'id,username,first_name,last_name,bio,created_at,counts,image'
            };

            get('https://api.pinterest.com/v1/me/', query, (profile) => {

                credentials.profile = {
                    id: profile.data.id,
                    username: profile.data.username,
                    name: {
                        first: profile.data.first_name,
                        last: profile.data.last_name
                    },
                    raw: profile
                };

                return callback();
            });
        }
    };
};
