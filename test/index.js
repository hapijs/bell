// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Bell = require('../');
var Mock = require('./mock');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;


describe('Bell', function () {

    it('authenticates an endpoint via oauth', function (done) {

        var mock = new Mock.V1();
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
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login?next=%2Fhome', function (res) {

                    var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                    mock.server.inject(res.headers.location, function (res) {

                        expect(res.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                        server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                            expect(res.result.provider).to.equal('custom');
                            expect(res.result.query.next).to.equal('/home');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates an endpoint via oauth2', function (done) {

        var mock = new Mock.V2();
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
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', function (res) {

                    var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

                    mock.server.inject(res.headers.location, function (res) {

                        expect(res.headers.location).to.contain('http://localhost:80/login?code=1&state=');

                        server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                            expect(res.result.provider).to.equal('custom');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('overrides cookie name', function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: provider,
                    cookie: 'ring'
                });

                server.route({
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', function (res) {

                    expect(res.headers['set-cookie'][0]).to.contain('ring=');
                    mock.stop(done);
                });
            });
        });
    });

    it('allows multiple custom provider names', function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom_1', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: Hoek.merge(Hoek.clone(provider), { name: "custom_1" }),
                    cookie: 'ring_1'
                });

                server.auth.strategy('custom_2', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: Hoek.merge(Hoek.clone(provider), { name: "custom_2" }),
                    cookie: 'ring_2'
                });

                server.route({
                    method: '*',
                    path: '/login_1',
                    config: {
                        auth: 'custom_1',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.route({
                    method: '*',
                    path: '/login_2',
                    config: {
                        auth: 'custom_2',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login_1', function (res) {

                    expect(res.headers['set-cookie'][0]).to.contain('ring_1=');
                    server.inject('/login_2', function (res) {

                        expect(res.headers['set-cookie'][0]).to.contain('ring_2=');
                        mock.stop(done);
                    });
                });
            });
        });
    });
});
