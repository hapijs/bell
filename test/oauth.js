// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Boom = require('boom');
var Bell = require('../');
var Mock = require('./mock');
var Providers = require('../lib/providers');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Bell', function () {

    describe('#v1', function () {

        it('errors on missing next hop', function (done) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: 'twitter'
                });

                server.inject('/bell/door', function (res) {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on absolute next hop', function (done) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: 'twitter'
                });

                server.inject('/bell/door?next=http', function (res) {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on missing oauth_verifier', function (done) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: 'twitter'
                });

                server.inject('/bell/door?oauth_token=123', function (res) {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on missing cookie on token step', function (done) {

            var server = new Hapi.Server('localhost');
            server.pack.register(Bell, function (err) {

                expect(err).to.not.exist;

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: 'twitter'
                });

                server.inject('/bell/door?oauth_token=123&oauth_verifier=123', function (res) {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('fails getting temporary credentials', function (done) {

            var mock = new Mock.V1({ temporary: true });
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

                    server.inject('http://localhost:80/bell/door?next=%2F', function (res) {

                        expect(res.statusCode).to.equal(500);
                        mock.stop(done);
                    });
                });
            });
        });

        it('fails getting token credentials', function (done) {

            var mock = new Mock.V1({ token: true });
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

                    server.inject('http://localhost:80/bell/door?next=%2F', function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates an endpoint via oauth with auth provider parameters', function (done) {

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
                        providerParams: { special: true }
                    });

                    server.inject('http://localhost:80/bell/door?next=%2F', function (res) {

                        expect(res.headers.location).to.equal(mock.uri + '/auth?special=true&oauth_token=1');
                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/bell/door?oauth_token=1&oauth_verifier=123&extra=true');
                            mock.stop(done);
                        });
                    });
                });
            });
        });

        it('authenticates with mock Twitter', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.twitter);
                    Hoek.merge(Providers.twitter, provider);

                    Mock.override('https://api.twitter.com/1.1/users/show.json', Boom.badRequest());

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
                                    Mock.clear();
                                    mock.stop(done);
                                });
                            });
                        });
                    });
                });
            });
        });

        it('errors on mismatching token', function (done) {

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

                    server.inject('http://localhost:80/bell/door?next=%2F', function (res) {

                        var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: 'http://localhost:80/bell/door?oauth_token=2&oauth_verifier=123', headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });
});
