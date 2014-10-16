// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Boom = require('boom');
var Bell = require('../');
var Mock = require('./mock');
var OAuth = require('../lib/oauth');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;


describe('Bell', function () {

    describe('#v1', function () {

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

                server.inject('/login?oauth_token=123', function (res) {

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

                server.inject('/login?oauth_token=123&oauth_verifier=123', function (res) {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on rejected query parameter', function (done) {

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

                server.inject('/login?error=access_denied', function (res) {

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

                        expect(res.headers.location).to.equal(mock.uri + '/auth?special=true&oauth_token=1');
                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123&extra=true');
                            mock.stop(done);
                        });
                    });
                });
            });
        });

        it('passes profileParams', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {
                    expect(err).to.not.exist;

                    var custom = Bell.providers.twitter();
                    Hoek.merge(custom, provider);

                    Mock.override('https://api.twitter.com/1.1/users/show.json', function (uri) {
                        expect(uri).to.equal('https://api.twitter.com/1.1/users/show.json?user_id=1234567890&fields=id%2Cemail');
                        Mock.clear();
                        mock.stop(done);
                    });

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'twitter',
                        clientSecret: 'secret',
                        provider: custom,
                        profileParams: {
                            fields: 'id,email'
                        }
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) { });
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

                    var custom = Bell.providers.twitter();
                    Hoek.merge(custom, provider);

                    Mock.override('https://api.twitter.com/1.1/users/show.json', Boom.badRequest());

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'twitter',
                        clientSecret: 'secret',
                        provider: custom
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
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            expect(res.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);

                                Mock.clear();
                                mock.stop(done);
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
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: 'http://localhost:80/login?oauth_token=2&oauth_verifier=123', headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#v2', function () {

        it('authenticates an endpoint with provider parameters', function (done) {

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
                        provider: provider,
                        providerParams: { special: true }
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

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
                        mock.stop(done);
                    });
                });
            });
        });

        it('authenticates an endpoint with custom scope', function (done) {

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
                        provider: provider,
                        scope: ['a']
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

                        expect(res.headers.location).to.contain('scope=a');
                        mock.stop(done);
                    });
                });
            });
        });
    });

    describe('#v2', function () {

        it('errors on missing cookie in token step', function (done) {

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

                            server.inject(res.headers.location, function (res) {

                                expect(res.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on mismatching state', function (done) {

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

                            server.inject({ url: res.headers.location + 'xx', headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on failed token request', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override(provider.token, null);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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
                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on errored token request', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override(provider.token, Boom.badRequest());

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on invalid token request response', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override(provider.token, '{x');

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on failed profile request', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/me', null);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on errored profile request', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/me', Boom.badRequest());

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on invalid profile request', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/me', '{c');

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.statusCode).to.equal(500);
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('passes profile get params', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/me', function (uri) {

                        expect(uri).to.equal('https://graph.facebook.com/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102');
                        Mock.clear();
                        mock.stop(done);
                    });

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) { });
                        });
                    });
                });
            });
        });

        it('passes profileParams', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {
                    expect(err).to.not.exist;

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/me', function (uri) {
                        expect(uri).to.equal('https://graph.facebook.com/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
                        Mock.clear();
                        mock.stop(done);
                    });

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: custom,
                        profileParams: {
                            fields: 'id,email,picture,name,first_name,middle_name,last_name,link,locale,timezone,updated_time,verified,gender'
                        }
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

                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) { });
                        });
                    });
                });
            });
        });
    });

    describe('Client', function () {

        it('accepts empty client secret', { parallel: false }, function (done) {

            var client = new OAuth.Client({ provider: Bell.providers.twitter() });
            expect(client.settings.clientSecret).to.equal('&');
            done();
        });

        describe('#request', function () {

            it('errors on failed request', function (done) {

                Mock.override('http://example.com/', null);

                var client = new OAuth.Client({ provider: Bell.providers.twitter() });
                client.request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, 'secret', 'type', function (err, payload) {

                    expect(err.message).to.equal('unknown');
                    Mock.clear();
                    done();
                });
            });

            it('errors on invalid response', function (done) {

                Mock.override('http://example.com/', '{x');

                var client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                client.request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, 'secret', 'type', function (err, payload) {

                    expect(err.message).to.equal('Received invalid payload from prov type endpoint: Unexpected token x');
                    Mock.clear();
                    done();
                });
            });
        });

        describe('#baseUri', function () {

            it('removes default port', function (done) {

                expect(OAuth.Client.baseUri('http://example.com:80/x')).to.equal('http://example.com/x');
                expect(OAuth.Client.baseUri('https://example.com:443/x')).to.equal('https://example.com/x');
                done();
            });

            it('keeps non-default port', function (done) {

                expect(OAuth.Client.baseUri('http://example.com:8080/x')).to.equal('http://example.com:8080/x');
                expect(OAuth.Client.baseUri('https://example.com:8080/x')).to.equal('https://example.com:8080/x');
                done();
            });
        });

        describe('#signature', function () {

            it('generates RFC 5849 example', function (done) {

                var client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                var tokenSecret = 'dh893hdasih9';

                var params = {
                    b5: '=%3D',
                    a3: ['a', '2 q'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                var oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                var signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('r6/TJjbCOr97/+UU0NsvSne7s5g=');
                done();
            });

            it('handles array param with reveresed order', function (done) {

                var client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                var tokenSecret = 'dh893hdasih9';

                var params = {
                    b5: '=%3D',
                    a3: ['2 q', 'a'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                var oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                var signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('r6/TJjbCOr97/+UU0NsvSne7s5g=');
                done();
            });

            it('handles array param with same value', function (done) {

                var client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                var tokenSecret = 'dh893hdasih9';

                var params = {
                    b5: '=%3D',
                    a3: ['a', 'a'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                var oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                var signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('dub5m7j8nN7KtHBochesFDQHea4=');
                done();
            });
        });
    });
});
