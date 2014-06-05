// Load modules


// Declare internals

var internals = {};


exports = module.exports = {
    protocol: 'oauth',
    temporary: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
    auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
    token: 'https://api.login.yahoo.com/oauth/v2/get_token',
    profile: function (credentials, params, get, callback) {

        get('https://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile', { format: 'json' }, function (err, payload) {

            if (err) {
                return callback(err);
            }

            credentials.profile = {
                id: payload.profile.guid,
                displayName: payload.profile.givenName + ' ' + payload.profile.familyName,
                name: {
                    first: payload.profile.givenName,
                    last: payload.profile.familyName
                },
                raw: payload
            };

            return callback();
        });
    }
};
