// Load modules
var Client = require('../oauth').Client;

// Declare internals

var internals = {};


exports = module.exports = function () {

    return {
        protocol: 'oauth',
        temporary: 'https://bitbucket.org/api/1.0/oauth/request_token',
        auth: 'https://bitbucket.org/api/1.0/oauth/authenticate',
        token: 'https://bitbucket.org/api/1.0/oauth/access_token',
        version: '1.0',
        profile: function (credentials, params, get, callback) {
            
            get('https://bitbucket.org/api/1.0/user', null, function (profile) {

                credentials.profile = {};
                credentials.profile.id = profile.user.username;
                credentials.profile.username = profile.user.username;
                credentials.profile.displayName = profile.user.first_name + (profile.user.last_name ? ' ' + profile.user.last_name : '');
                credentials.profile.raw = profile;
                return callback();
            });
        }
    };
};