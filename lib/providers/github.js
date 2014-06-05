// Load modules


// Declare internals

var internals = {};


exports = module.exports = {
    protocol: 'oauth2',
    auth: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: ['user:email'],
    scopeSeparator: ',',
    headers: { 'User-Agent': 'hapi-bell-github' },
    profile: function (credentials, params, get, callback) {

        get('https://api.github.com/user', null, function (profile) {

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
