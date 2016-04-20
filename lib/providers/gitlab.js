'use strict';

exports = module.exports = function (options) {

    options = options || {};

    const uri = options.uri || 'https://gitlab.com';
    const user = uri + '/api/v3/user';

    return {
        protocol: 'oauth2',
        auth: uri + '/oauth/authorize',
        token: uri + '/oauth/token',
        profile: function (credentials, params, get, callback) {

            get(user, null, (profile) => {

                credentials.profile = profile;

                return callback();
            });
        }
    };
};
