// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Bell = require('../');
var Providers = require('../lib/providers');
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

    it('authenticates with mock Twitter', { parallel: false }, function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                var origProvider = Hoek.clone(Providers.twitter);
                Hoek.merge(Providers.twitter, provider);

                Mock.override('https://api.twitter.com/1.1/users/show.json', {
                    property: 'something'
                });

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'twitter',
                    clientSecret: 'secret',
                    provider: 'twitter'
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

                    server.inject(res.headers.location, function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/door?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                                expect(res.headers.location).to.equal('http://localhost:80/');

                                server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                    expect(res.result).to.deep.equal({
                                        provider: 'twitter',
                                        status: 'authenticated',
                                        token: 'final',
                                        secret: 'secret',
                                        profile: {
                                            id: '1234567890',
                                            username: 'Steve Stevens',
                                            raw: {
                                                property: 'something'
                                            }
                                        }
                                    });

                                    Providers.twitter = origProvider;
                                    Mock.clear();
                                    mock.stop(done);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock Twitter (without extended profile)', { parallel: false }, function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                var origProvider = Hoek.clone(Providers.twitter);
                Hoek.merge(Providers.twitter, provider);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'twitter',
                    clientSecret: 'secret',
                    provider: 'twitter',
                    extendedProfile: false
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

                    server.inject(res.headers.location, function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/door?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                                expect(res.headers.location).to.equal('http://localhost:80/');

                                server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                    expect(res.result).to.deep.equal({
                                        provider: 'twitter',
                                        status: 'authenticated',
                                        token: 'final',
                                        secret: 'secret',
                                        profile: {
                                            id: '1234567890',
                                            username: 'Steve Stevens'
                                        }
                                    });

                                    Providers.twitter = origProvider;
                                    mock.stop(done);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock Twitter (profile error)', { parallel: false }, function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                var origProvider = Hoek.clone(Providers.twitter);
                Hoek.merge(Providers.twitter, provider);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'twitter',
                    clientSecret: 'secret',
                    provider: 'twitter'
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

                    server.inject(res.headers.location, function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/door?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Providers.twitter = origProvider;
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });
});
