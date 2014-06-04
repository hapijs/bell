// Load modules

var Querystring = require('querystring');
var Lab = require('lab');
var Hapi = require('hapi');
var Hawk = require('hawk');
var Bell = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Bell', function () {

    it('authenticates an endpoint via oauth', function (done) {

        var mock = new internals.OAuthMock();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: provider
                });

                server.route({
                    method: 'GET',
                    path: '/',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/', function (res) {

                    expect(res.headers.location).to.equal('http://localhost:80/bell/door?next=%2F');
                    server.inject(res.headers.location.replace('http://localhost:80', ''), function (res) {

                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');
                        mock.server.inject('/auth?oauth_token=1', function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/door?oauth_token=1&oauth_verifier=123');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });
});


internals.OAuthMock = function () {

    this.tokens = {};

    this.server = new Hapi.Server(0, 'localhost');
    this.server.route([
        {
            method: 'POST',
            path: '/temporary',
            config: {
                bind: this,
                handler: function (request, reply) {

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
                    
                    reply().redirect(unescape(token.callback) + '?oauth_token=' + request.query.oauth_token + '&oauth_verifier=' + token.verifier);
                }
            }
        },
        {
            method: 'POST',
            path: '/token',
            config: {
                bind: this,
                handler: function (request, reply) {

                    var header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);

                    var token = this.tokens[request.query.oauth_token];
                    expect(token).to.exist;
                    expect(token.verifier).to.equal(header.oauth_verifier);
                    expect(token.authorized).to.equal(true);

                    var payload = {
                        oauth_token: 'final',
                        oauth_token_secret: 'secret'
                    };

                    reply(Querystring.encode(payload)).type('application/x-www-form-urlencoded');
                }
            }
        }
    ]);
};


internals.OAuthMock.prototype.start = function (callback) {

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


internals.OAuthMock.prototype.stop = function (callback) {

    this.server.stop(callback);
};