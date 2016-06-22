'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth',
        signatureMethod: 'HMAC-SHA1',
        temporary: 'https://www.tumblr.com/oauth/request_token',
        auth: 'https://www.tumblr.com/oauth/authorize',
        token: 'https://www.tumblr.com/oauth/access_token',
        profile: function (credentials, params, get, callback) {

            get('https://api.tumblr.com/v2/user/info', {}, (profile) => {

                credentials.profile = {
                    username: profile.response.user.name,
                    raw: profile.response.user
                };
                return callback();
            });
        }
    };
};
