// Load modules

var Querystring = require('querystring');
var Hawk = require('hawk');
var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Wreck = require('wreck');
var Boom = require('boom');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Lab.expect;


exports.V1 = internals.V1 = function (fail) {

    fail = fail || {};

    this.tokens = {};

    this.server = new Hapi.Server(0, 'localhost');
    this.server.route([
        {
            method: 'POST',
            path: '/temporary',
            config: {
                bind: this,
                handler: function (request, reply) {

                    if (fail.temporary) {
                        return reply(Boom.badRequest());
                    }

                    var header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_signature_method', 'oauth_callback', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    expect(header.oauth_callback).to.exist;

                    var token = String(Object.keys(this.tokens).length + 1);
                    this.tokens[token] = {
                        authorized: false,
                        secret: 'secret',
                        callback: header.oauth_callback
                    };

                    var payload = {
                        oauth_token: token,
                        oauth_token_secret: 'secret',
                        oauth_callback_confirmed: true
                    };

                    reply(Querystring.encode(payload)).type('application/x-www-form-urlencoded');
                }
            }
        },
        {
            method: 'GET',
            path: '/auth',
            config: {
                bind: this,
                handler: function (request, reply) {

                    var token = this.tokens[request.query.oauth_token];
                    expect(token).to.exist;

                    token.authorized = true;
                    token.verifier = '123';

                    var extra = Object.keys(request.query).length > 1 ? '&extra=true' : '';
                    reply().redirect(unescape(token.callback) + '?oauth_token=' + request.query.oauth_token + '&oauth_verifier=' + token.verifier + extra);
                }
            }
        },
        {
            method: 'POST',
            path: '/token',
            config: {
                bind: this,
                handler: function (request, reply) {

                    if (fail.token) {
                        return reply(Boom.badRequest());
                    }

                    var header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    var token = this.tokens[header.oauth_token];
                    expect(token).to.exist;
                    expect(token.verifier).to.equal(header.oauth_verifier);
                    expect(token.authorized).to.equal(true);

                    var payload = {
                        oauth_token: 'final',
                        oauth_token_secret: 'secret'
                    };

                    if (header.oauth_consumer_key === 'twitter') {
                        payload.user_id = '1234567890';
                        payload.screen_name = 'Steve Stevens';
                    }

                    reply(Querystring.encode(payload)).type('application/x-www-form-urlencoded');
                }
            }
        }
    ]);
};


internals.V1.prototype.start = function (callback) {

    var self = this;

    this.server.start(function (err) {

        expect(err).to.not.exist;

        self.uri = self.server.info.uri;

        return callback({
            protocol: 'oauth',
            temporary: self.server.info.uri + '/temporary',
            auth: self.server.info.uri + '/auth',
            token: self.server.info.uri + '/token'
        });
    })
};


internals.V1.prototype.stop = function (callback) {

    this.server.stop(callback);
};


exports.V2 = internals.V2 = function () {

    this.codes = {};

    this.server = new Hapi.Server(0, 'localhost');
    this.server.route([
        {
            method: 'GET',
            path: '/auth',
            config: {
                bind: this,
                handler: function (request, reply) {

                    var code = String(Object.keys(this.codes).length + 1);
                    this.codes[code] = {
                        redirect_uri: request.query.redirect_uri,
                        client_id: request.query.client_id
                    };

                    reply().redirect(request.query.redirect_uri + '?code=' + code + '&state=' + request.query.state);
                }
            }
        },
        {
            method: 'POST',
            path: '/token',
            config: {
                bind: this,
                handler: function (request, reply) {

                    var code = this.codes[request.payload.code];
                    expect(code).to.exist;
                    expect(code.redirect_uri).to.equal(request.payload.redirect_uri);
                    expect(code.client_id).to.equal(request.payload.client_id);

                    var payload = {
                        access_token: '456',
                        expires_in: 3600
                    };

                    if (code.client_id === 'instagram') {
                        payload.user = {
                            id: '123456789',
                            username: 'stevegraham',
                            full_name: 'Steve Graham',
                            profile_picture: 'http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg'
                        };
                    }

                    reply(payload);
                }
            }
        }
    ]);
};


internals.V2.prototype.start = function (callback) {

    var self = this;

    this.server.start(function (err) {

        expect(err).to.not.exist;

        self.uri = self.server.info.uri;

        return callback({
            protocol: 'oauth2',
            auth: self.server.info.uri + '/auth',
            token: self.server.info.uri + '/token'
        });
    })
};


internals.V2.prototype.stop = function (callback) {

    this.server.stop(callback);
};


exports.override = function (uri, payload) {

    var override = function (method) {

        return function (dest) {

            var options = arguments.length === 3 ? arguments[1] : {};
            var callback = arguments.length === 3 ? arguments[2] : arguments[1];

            if (dest.indexOf(uri) === 0) {
                if (typeof payload === 'function') {
                    return payload(dest);
                }

                if (payload instanceof Error) {
                    return Hoek.nextTick(callback)(null, { statusCode: 400 }, JSON.stringify({ message: payload.message }));
                }

                if (payload === null) {
                    return Hoek.nextTick(callback)(Boom.internal('unknown'));
                }

                return Hoek.nextTick(callback)(null, { statusCode: 200 }, typeof payload === 'string' ? payload : JSON.stringify(payload));
            }

            return internals.nipple[method].apply(null, arguments);
        }
    };

    internals.nipple = {
        get: Wreck.get,
        post: Wreck.post
    };

    Wreck.get = override('get');
    Wreck.post = override('post');
};


exports.clear = function (uri) {

    Wreck.get = internals.nipple.get;
    Wreck.post = internals.nipple.post;
};