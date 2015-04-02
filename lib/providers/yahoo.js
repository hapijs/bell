// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth',
        temporary: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
        auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
        token: 'https://api.login.yahoo.com/oauth/v2/get_token',
        profile: function (credentials, params, get, callback) {

            get('https://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile', { format: 'json' }, function (profile) {

                credentials.profile = {
                    id: profile.profile.guid,
                    displayName: profile.profile.givenName + ' ' + profile.profile.familyName,
                    name: {
                        first: profile.profile.givenName,
                        last: profile.profile.familyName
                    },
                    raw: profile
                };

                return callback();
            });
        }
    };
};
