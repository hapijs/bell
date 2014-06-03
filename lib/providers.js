// Load modules

var Crypto = require('crypto');
var Querystring = require('querystring');
var Boom = require('boom');
var Nipple = require('nipple');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports = module.exports = {
    facebook: {
        protocol: 'oauth2',
        auth: 'https://graph.facebook.com/oauth/authorize',
        token: 'https://graph.facebook.com/oauth/access_token',
        scope: ['email'],
        scopeSeparator: ',',
        profile: function (credentials, callback) {

            var query = {
                access_token: credentials.token,
                appsecret_proof: Crypto.createHmac('sha256', this.settings.clientSecret).update(credentials.token).digest('hex')
            };

            Nipple.get('https://graph.facebook.com/me?' + Querystring.stringify(query), function (err, res, payload) {

                if (err ||
                    res.statusCode !== 200) {

                    return callback(Boom.internal('Failed obtaining facebook user profile', err || payload));
                }

                payload = Utils.parse(payload);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from facebook user profile', payload));
                }

                credentials.profile = {
                    id: payload.id,
                    username: payload.username,
                    displayName: payload.name,
                    name: {
                        first: payload.first_name,
                        last: payload.last_name,
                        middle: payload.middle_name
                    },
                    email: payload.email,
                    raw: payload
                };

                return callback();
            });
        }
    },
    github: {
        protocol: 'oauth2',
        auth: 'https://github.com/login/oauth/authorize',
        token: 'https://github.com/login/oauth/access_token',
        scope: ['user:email'],
        scopeSeparator: ',',
        headers: { 'User-Agent': 'hapi-bell-github' },
        profile: function (credentials, callback) {

            var query = {
                access_token: credentials.token
            };

            Nipple.get('https://api.github.com/user?' + Querystring.stringify(query), { headers: { 'User-Agent': 'hapi-bell-github' } }, function (err, res, payload) {

                if (err ||
                    res.statusCode !== 200) {

                    return callback(Boom.internal('Failed obtaining github user profile', err || payload));
                }

                payload = Utils.parse(payload);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from github user profile', payload));
                }

                credentials.profile = {
                    id: payload.id,
                    username: payload.login,
                    displayName: payload.name,
                    email: payload.email,
                    raw: payload
                };

                return callback();
            });
        }
    },
    google: {
        protocol: 'oauth2',
        auth: 'https://accounts.google.com/o/oauth2/auth',
        token: 'https://accounts.google.com/o/oauth2/token',
        scope: ['openid', 'email'],
        profile: function (credentials, callback) {

            var query = {
                access_token: credentials.token
            };

            Nipple.get('https://www.googleapis.com/oauth2/v1/userinfo?' + Querystring.stringify(query), function (err, res, payload) {

                if (err ||
                    res.statusCode !== 200) {

                    return callback(Boom.internal('Failed obtaining google user profile', err || payload));
                }

                payload = Utils.parse(payload);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from google user profile', payload));
                }

                credentials.profile = {
                    id: payload.id,
                    username: payload.username,
                    displayName: payload.name,
                    name: {
                        first: payload.given_name,
                        last: payload.family_name,
                    },
                    email: payload.email,
                    raw: payload
                };

                return callback();
            });
        }
    },
    live: {
        protocol: 'oauth2',
        auth: 'https://login.live.com/oauth20_authorize.srf',
        token: 'https://login.live.com/oauth20_token.srf',
        scope: ['wl.basic', 'wl.emails'],
        profile: function (credentials, callback) {

            var query = {
                access_token: credentials.token
            };

            Nipple.get('https://apis.live.net/v5.0/me?' + Querystring.stringify(query), function (err, res, payload) {

                if (err ||
                    res.statusCode !== 200) {

                    return callback(Boom.internal('Failed obtaining live user profile', err || payload));
                }

                payload = Utils.parse(payload);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from live user profile', payload));
                }

                credentials.profile = {
                    id: payload.id,
                    username: payload.username,
                    displayName: payload.name,
                    name: {
                        first: payload.first_name,
                        last: payload.last_name,
                    },
                    email: payload.emails && (payload.emails.preferred || payload.emails.account),
                    raw: payload
                };

                return callback();
            });
        }
    },
    twitter: {
        protocol: 'oauth',
        temporary: 'https://api.twitter.com/oauth/request_token',
        auth: 'https://api.twitter.com/oauth/authenticate',
        token: 'https://api.twitter.com/oauth/access_token',
        profile: function (credentials, params, client, callback) {

            credentials.profile = {
                id: params.user_id,
                username: params.screen_name
            };

            if (!this.settings.extendedProfile) {
                return callback();
            }

            client.getProtectedResource('https://api.twitter.com/1.1/users/show.json?user_id=' + params.user_id, 'GET', credentials.token, credentials.secret, function (err, response) {

                var payload = Utils.parse(response);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from twitter user profile', payload));
                }

                credentials.profile.displayName = payload.name;
                credentials.profile.raw = payload;
                return callback();
            });
        }
    },
    yahoo: {
        protocol: 'oauth',
        temporary: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
        auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
        token: 'https://api.login.yahoo.com/oauth/v2/get_token',
        profile: function (credentials, params, client, callback) {

            client.getProtectedResource('https://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile?format=json', 'GET', credentials.token, credentials.secret, function (err, response) {

                var payload = Utils.parse(response);
                if (payload instanceof Error) {
                    return callback(Boom.internal('Received invalid payload from yahoo user profile', payload));
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
    }
};
