'use strict';

exports = module.exports = function () {

    const uri = 'https://api.trakt.tv';
    const user = uri + '/users/me?extended=full';

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
