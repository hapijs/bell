// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Hoek = require('hoek');
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

    describe('#facebook', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.facebook);
                    Hoek.merge(Providers.facebook, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith',
                        email: 'steve@example.com'
                    };

                    Mock.override('https://graph.facebook.com/me', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'facebook',
                        clientSecret: 'secret',
                        provider: 'facebook'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'facebook',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith',
                                            middle: undefined
                                        },
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

                                Providers.facebook = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#github', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.github);
                    Hoek.merge(Providers.github, provider);

                    var profile = {
                        id: '1234567890',
                        login: 'steve',
                        name: 'steve',
                        email: 'steve@example.com'
                    };

                    Mock.override('https://api.github.com/user', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'github',
                        clientSecret: 'secret',
                        provider: 'github'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'github',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

                                Providers.github = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#google', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.google);
                    Hoek.merge(Providers.google, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        given_name: 'steve',
                        family_name: 'smith',
                        email: 'steve@example.com'
                    };

                    Mock.override('https://www.googleapis.com/oauth2/v1/userinfo', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'google',
                        clientSecret: 'secret',
                        provider: 'google'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'google',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

                                Providers.google = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#live', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.live);
                    Hoek.merge(Providers.live, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith',
                        emails: {
                            preferred: 'steve@example.com',
                            account: 'steve@example.net'
                        }
                    };

                    Mock.override('https://apis.live.net/v5.0/me', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'live',
                        clientSecret: 'secret',
                        provider: 'live'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'live',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

                                Providers.live = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock (no preferred email)', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.live);
                    Hoek.merge(Providers.live, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith',
                        emails: {
                            account: 'steve@example.net'
                        }
                    };

                    Mock.override('https://apis.live.net/v5.0/me', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'live',
                        clientSecret: 'secret',
                        provider: 'live'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'live',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: 'steve@example.net',
                                        raw: profile
                                    }
                                });

                                Providers.live = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock (no emails)', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.live);
                    Hoek.merge(Providers.live, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith'
                    };

                    Mock.override('https://apis.live.net/v5.0/me', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'live',
                        clientSecret: 'secret',
                        provider: 'live'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'live',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: undefined,
                                        raw: profile
                                    }
                                });

                                Providers.live = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock (empty email)', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.live);
                    Hoek.merge(Providers.live, provider);

                    var profile = {
                        id: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith',
                        emails: {}
                    };

                    Mock.override('https://apis.live.net/v5.0/me', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'live',
                        clientSecret: 'secret',
                        provider: 'live'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'live',
                                    token: '456',
                                    refreshToken: undefined,
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: undefined,
                                        raw: profile
                                    }
                                });

                                Providers.live = origProvider;
                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#twitter', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

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

                                expect(res.result).to.deep.equal({
                                    provider: 'twitter',
                                    token: 'final',
                                    secret: 'secret',
                                    profile: {
                                        id: '1234567890',
                                        username: 'Steve Stevens',
                                        displayName: undefined,
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

        it('authenticates with mock (without extended profile)', { parallel: false }, function (done) {

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

                                expect(res.result).to.deep.equal({
                                    provider: 'twitter',
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

    describe('#yahoo', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server('localhost');
                server.pack.register(Bell, function (err) {

                    expect(err).to.not.exist;

                    var origProvider = Hoek.clone(Providers.yahoo);
                    Hoek.merge(Providers.yahoo, provider);

                    var profile = {
                        profile: {
                            guid: '1234567890',
                            givenName: 'steve',
                            familyName: 'smith'
                        }
                    };

                    Mock.override('https://social.yahooapis.com/v1/user/', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'yahoo',
                        clientSecret: 'secret',
                        provider: 'yahoo'
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

                                expect(res.result).to.deep.equal({
                                    provider: 'yahoo',
                                    token: 'final',
                                    secret: 'secret',
                                    profile: {
                                        id: '1234567890',
                                        displayName: 'steve smith',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        raw: profile
                                    }
                                });

                                Providers.yahoo = origProvider;
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
