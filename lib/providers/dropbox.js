// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {
    return {
        protocol: 'oauth2',
        auth: 'https://www.dropbox.com/1/oauth2/authorize',
        token: 'https://api.dropbox.com/1/oauth2/token',
        profile: function (credentials, params, get, callback) {
            get('https://api.dropbox.com/1/account/info', null, function (profile) {
                credentials.profile = profile;
                return callback();
            });
        }
    };
};
