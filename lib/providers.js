// Load modules


// Declare internals

var internals = {};


exports = module.exports = {
    facebook: {
        protocol: 'oauth2',
        auth: 'https://graph.facebook.com/oauth/authorize',
        token: 'https://graph.facebook.com/oauth/access_token',
        profile: 'https://graph.facebook.com/me'
    },
    google: {
        protocol: 'oauth2',
        auth: 'https://accounts.google.com/o/oauth2/auth',
        token: 'https://accounts.google.com/o/oauth2/token',
        profile: 'https://www.googleapis.com/oauth2/v1/userinfo'
    },
    twitter: {
        protocol: 'oauth',
        temporary: 'https://api.twitter.com/oauth/request_token',
        auth: 'https://api.twitter.com/oauth/authenticate',
        token: 'https://api.twitter.com/oauth/access_token'
    },
    yahoo: {
        protocol: 'oauth',
        temporary: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
        auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
        token: 'https://api.login.yahoo.com/oauth/v2/get_token',
        profile: 'c'
    }
};
