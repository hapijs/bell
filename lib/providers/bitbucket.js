'use strict';

exports = module.exports = function () {

    return {
        protocol: 'oauth2',
        auth: 'https://bitbucket.org/site/oauth2/authorize',
        token: 'https://bitbucket.org/site/oauth2/access_token',
        profile: function (credentials, params, get, callback) {

            get('https://api.bitbucket.org/2.0/user', null, (profile) => {

                credentials.profile = {
                    id: profile.uuid,
                    username: profile.username,
                    displayName: profile.display_name,
                    raw: profile
                };
                return callback();
            });
        }
    };
};
