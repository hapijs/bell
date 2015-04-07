// Load modules

var Bell = require('../');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Lab = require('lab');
var Mock = require('./mock');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Bell', function () {

    describe('#facebook', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.github();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock and custom uri', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.github({ uri: 'http://example.com' });
                    Hoek.merge(custom, provider);

                    var profile = {
                        id: '1234567890',
                        login: 'steve',
                        name: 'steve',
                        email: 'steve@example.com'
                    };

                    Mock.override('http://example.com/api/v3/user', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'github',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        username: 'steve',
                                        displayName: 'steve',
                                        email: 'steve@example.com',
                                        raw: profile
                                    }
                                });

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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.google();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

describe('#linkedin', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.linkedin();
                    Hoek.merge(custom, provider);

                    var profile = {
                        id: '1234567890',
                        firstName: 'steve',
                        lastName: 'smith',
                        headline: 'Master of the universe'
                    };

                    Mock.override('https://api.linkedin.com/v1/people/~', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'linkedin',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        headline: 'Master of the universe',
                                        raw: profile
                                    }
                                });

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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.live();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.live();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.live();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.live();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.twitter();
                    Hoek.merge(custom, provider);

                    Mock.override('https://api.twitter.com/1.1/users/show.json', {
                        property: 'something'
                    });

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
                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        username: 'Steve Stevens',
                                        displayName: undefined,
                                        raw: {
                                            property: 'something'
                                        }
                                    }
                                });

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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.twitter({ extendedProfile: false });
                    Hoek.merge(custom, provider);

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
                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        username: 'Steve Stevens'
                                    }
                                });

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

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.yahoo();
                    Hoek.merge(custom, provider);

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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
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

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#foursquare', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.foursquare();
                    Hoek.merge(custom, provider);

                    var data = {
                        response: {
                            user: {
                                id: '1234',
                                firstName: 'Steve',
                                lastName: 'Smith',
                                gender: 'male',
                                relationship: 'self',
                                photo: {
                                    prefix: 'https://irs0.4sqi.net/img/user/',
                                    suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                                },
                                contact: {
                                    email: 'stevesmith@test.com'
                                }
                            }
                        }
                    };

                    Mock.override('https://api.foursquare.com/v2/users/self', data);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'foursquare',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {

                                        id: '1234',
                                        displayName: 'Steve Smith',
                                        name: {
                                            first: 'Steve',
                                            last: 'Smith'
                                        },
                                        email: data.response.user.contact.email,
                                        raw: data.response.user
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock when user has no email set', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.foursquare();
                    Hoek.merge(custom, provider);

                    var data = {
                        response: {
                            user: {
                                id: '1234',
                                firstName: 'Steve',
                                lastName: 'Smith',
                                gender: 'male',
                                relationship: 'self',
                                photo: {
                                    prefix: 'https://irs0.4sqi.net/img/user/',
                                    suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                                },
                                contact: {
                                    facebook: 'http://facebook.com/stevesmith.test'
                                }
                            }
                        }
                    };

                    Mock.override('https://api.foursquare.com/v2/users/self', data);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'foursquare',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {

                                        id: '1234',
                                        displayName: 'Steve Smith',
                                        name: {
                                            first: 'Steve',
                                            last: 'Smith'
                                        },
                                        email: undefined,
                                        raw: data.response.user
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#instagram', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.instagram();
                    Hoek.merge(custom, provider);

                    var profile = {
                        meta: { code: 200 },
                        data: { property: 'something' }
                    };

                    Mock.override('https://api.instagram.com/v1/users/self', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'instagram',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '123456789',
                                        username: 'stevegraham',
                                        displayName: 'Steve Graham',
                                        raw: {
                                            property: 'something'
                                        }
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock (without extended profile)', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.instagram({ extendedProfile: false });
                    Hoek.merge(custom, provider);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'instagram',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '123456789',
                                        username: 'stevegraham',
                                        displayName: 'Steve Graham',
                                        raw: {
                                            id: '123456789',
                                            username: 'stevegraham',
                                            full_name: 'Steve Graham',
                                            profile_picture: 'http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg'
                                        }
                                    }
                                });

                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#vk', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.vk();
                    Hoek.merge(custom, provider);

                    var data = {
                        response: [{
                            uid: '1234567890',
                            first_name: 'steve',
                            last_name: 'smith'
                        }]
                    };

                    Mock.override('https://api.vk.com/method/users.get', data);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'vk',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        id: '1234567890',
                                        displayName: 'steve smith',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        raw: data.response[0]
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#bitbucket', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.bitbucket();
                    Hoek.merge(custom, provider);

                    Mock.override('https://bitbucket.org/api/1.0/user', {
                        repositories: [{}],
                        user: {
                            first_name: 'Steve',
                            last_name: 'Stevens',
                            username: 'steve_stevens'
                        }
                    });

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'bitbucket',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {
                                        id: 'steve_stevens',
                                        username: 'steve_stevens',
                                        displayName: 'Steve Stevens',
                                        raw: {
                                            repositories: [{}],
                                            user: {
                                                first_name: 'Steve',
                                                last_name: 'Stevens',
                                                username: 'steve_stevens'
                                            }
                                        }
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates with mock (last_name is empty)', { parallel: false }, function (done) {

            var mock = new Mock.V1();
            mock.start(function (provider) {


                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.bitbucket();
                    Hoek.merge(custom, provider);

                    Mock.override('https://bitbucket.org/api/1.0/user', {
                        // source: https://confluence.atlassian.com/display/BITBUCKET/user+Endpoint
                        repositories: [{}],
                        user: {
                            first_name: 'Steve',
                            last_name: '',
                            username: 'steve_stevens'
                        }
                    });

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
                        mock.server.inject(res.headers.location, function (res) {

                            server.inject({ url: res.headers.location, headers: { cookie: cookie } }, function (res) {

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: 'final',
                                    expiresIn: 3600,
                                    secret: 'secret',
                                    query: {},
                                    profile: {
                                        id: 'steve_stevens',
                                        username: 'steve_stevens',
                                        displayName: 'Steve',
                                        raw: {
                                            repositories: [{}],
                                            user: {
                                                first_name: 'Steve',
                                                last_name: '',
                                                username: 'steve_stevens'
                                            }
                                        }
                                    }
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#dropbox', function () {
        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.dropbox();
                    Hoek.merge(custom, provider);

                    var profile = {
                        display_name: '1234567890',
                        username: 'steve',
                        name: 'steve',
                        first_name: 'steve',
                        last_name: 'smith',
                        email: 'steve@example.com'
                    };

                    Mock.override('https://api.dropbox.com/1/account/info', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'dropbox',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: profile
                                });

                                Mock.clear();
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#arcgisonline', function () {

        it('authenticates with mock', { parallel: false }, function (done) {

            var mock = new Mock.V2();
            mock.start(function (provider) {

                var server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, function (err) {

                    expect(err).to.not.exist();

                    var custom = Bell.providers.arcgisonline();
                    Hoek.merge(custom, provider);

                    var profile = {
                        orgId: 'acme',
                        username: 'disco_steve',
                        fullName: 'steve smith',
                        firstName: 'steve',
                        lastName: 'smith',
                        email: 'steve@example.com',
                        role: 'terminator'
                    };

                    Mock.override('https://www.arcgis.com/sharing/rest/community/self', profile);

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'arcgisonline',
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

                                expect(res.result).to.deep.equal({
                                    provider: 'custom',
                                    token: '456',
                                    expiresIn: 3600,
                                    refreshToken: undefined,
                                    query: {},
                                    profile: {
                                        provider: 'arcgisonline',
                                        orgId: 'acme',
                                        username: 'disco_steve',
                                        displayName: 'steve smith',
                                        name: {
                                            first: 'steve',
                                            last: 'smith'
                                        },
                                        email: 'steve@example.com',
                                        role: 'terminator',
                                        raw: profile
                                    }
                                });

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
