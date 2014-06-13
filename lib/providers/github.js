// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    options = options || {};

    var uri = options.uri || 'https://github.com';
    var user = options.uri ? options.uri + '/api/v3/user' : 'https://api.github.com/user';

    return {
        protocol: 'oauth2',
        auth: uri + '/login/oauth/authorize',
        token: uri + '/login/oauth/access_token',
        scope: ['user:email'],
        scopeSeparator: ',',
        headers: { 'User-Agent': 'hapi-bell-github' },
        profile: function (credentials, params, get, callback) {

            get(user, null, function (profile) {

                credentials.profile = {
                    id: profile.id,
                    username: profile.login,
                    displayName: profile.name,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
