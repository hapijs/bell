// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Bell = require('../');
var Mock = require('./mock');


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

                    expect(res.headers.location).to.equal('http://localhost:80/bell/custom?next=%2F');

                    server.inject(res.headers.location, function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/custom?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                                expect(res.headers.location).to.equal('http://localhost:80/');

                                server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                    expect(res.result.provider).to.equal('custom');
                                    mock.stop(done);
                                });
                            });
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

                    expect(res.headers.location).to.equal('http://localhost:80/bell/custom?next=%2F');

                    server.inject(res.headers.location, function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Fbell%2Fcustom&state=');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.contain('http://localhost:80/bell/custom?code=1&state=');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                                expect(res.headers.location).to.equal('http://localhost:80/');

                                server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                    expect(res.result.provider).to.equal('custom');
                                    mock.stop(done);
                                });
                            });
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

                    expect(res.headers.location).to.equal('http://localhost:80/bell/custom?next=%2F');

                    server.inject(res.headers.location, function (res) {

                        expect(res.headers['set-cookie'][0]).to.contain('ring=');
                        mock.stop(done);
                    });
                });
            });
        });
    });

    it('overrides internal endpoint path', function (done) {

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
                    path: '/somewhere/else'
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

                    expect(res.headers.location).to.equal('http://localhost:80/somewhere/else?next=%2F');
                    mock.stop(done);
                });
            });
        });
    });
});
