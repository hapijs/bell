'use strict';

exports = module.exports = function () {

    return {
        protocol: 'oauth2',
        auth: 'https://bitbucket.org/site/oauth2/authorize',
        token: 'https://bitbucket.org/site/oauth2/access_token',
        profile: function (credentials, params, get, callback) {

            get('https://api.bitbucket.org/2.0/user', null, (profile) => {

                credentials.profile = {};
                credentials.profile.id = profile.username;
                credentials.profile.username = profile.username;
                credentials.profile.displayName = profile.display_name;
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};
