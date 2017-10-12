'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.dropbox.com/oauth2/authorize',
        token: 'https://api.dropboxapi.com/oauth2/token',
        profileMethod: 'post',
        profile: function (credentials, params, post, callback) {

            post('https://api.dropboxapi.com/2/users/get_current_account', null, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
