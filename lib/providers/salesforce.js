'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://login.salesforce.com';

    return {
        protocol: 'oauth2',
        auth: uri + '/services/oauth2/authorize',
        token: uri + '/services/oauth2/token',
        useParamsAuth: true,
        profile: function (credentials, params, get, callback) {

            const userUrl = params.id;

            get(userUrl, null, (profile) => {

                credentials.profile = {
                    id: profile.user_id,
                    username: profile.username,
                    displayName: profile.display_name,
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
