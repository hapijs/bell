'use strict';

// Load modules

const Bell = require('../');
const Boom = require('boom');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('./mock');
const OAuth = require('../lib/oauth');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Bell', () => {

    describe('v1()', () => {

        it('errors on missing oauth_verifier', (done) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

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

                server.inject('/login?oauth_token=123', (res) => {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on missing cookie on token step', (done) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

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

                server.inject('/login?oauth_token=123&oauth_verifier=123', (res) => {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('errors on rejected query parameter', (done) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

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

                server.inject('/login?error=access_denied', (res) => {

                    expect(res.statusCode).to.equal(500);
                    done();
                });
            });
        });

        it('fails getting temporary credentials', (done) => {

            const mock = new Mock.V1({ temporary: true });
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        expect(res.statusCode).to.equal(500);
                        mock.stop(done);
                    });
                });
            });
        });

        it('fails getting token credentials', (done) => {

            const mock = new Mock.V1({ token: true });
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('does not pass on runtime query params by default', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login?runtime=true', (res) => {

                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.stop(done);
                    });
                });
            });
        });

        it('passes on runtime query params with allowRuntimeProviderParams', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        allowRuntimeProviderParams: true
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

                    server.inject('/login?runtime=true', (res) => {

                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1&runtime=true');

                        mock.stop(done);
                    });
                });
            });
        });

        it('authenticates an endpoint via oauth with auth provider parameters', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.equal(mock.uri + '/auth?special=true&oauth_token=1');
                        mock.server.inject(res.headers.location, (response) => {

                            expect(response.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123&extra=true');
                            mock.stop(done);
                        });
                    });
                });
            });
        });

        it('passes profileParams', { parallel: false }, (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.twitter();
                    Hoek.merge(custom, provider);

                    Mock.override('https://api.twitter.com/1.1/users/show.json', (uri) => {

                        Mock.clear();
                        expect(uri).to.equal('https://api.twitter.com/1.1/users/show.json?user_id=1234567890&fields=id%2Cemail');
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => { });
                        });
                    });
                });
            });
        });

        it('authenticates with mock Twitter', { parallel: false }, (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.twitter();
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on mismatching token', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, () => {

                            server.inject({ url: 'http://localhost:80/login?oauth_token=2&oauth_verifier=123', headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors if isSecure is true when protocol is not https', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: true,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider
                    });

                    server.route({
                        method: '*',
                        path: '/login',
                        config: {
                            auth: 'custom',
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        expect(res.statusCode).to.equal(500);
                        done();
                    });
                });
            });
        });


        it('passes if isSecure is true when protocol is https (forced)', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        isSecure: true,
                        password: 'password',
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        forceHttps: true
                    });

                    server.route({
                        method: '*',
                        path: '/login',
                        config: {
                            auth: 'custom',
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://localhost:80/login?oauth_token=1&oauth_verifier=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('passes if isSecure is true when protocol is https (location)', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: true,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        location: 'https://differenthost:8888'
                    });

                    server.route({
                        method: '*',
                        path: '/login',
                        config: {
                            auth: 'custom',
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('forces https in callback_url when set in options', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        forceHttps: true
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://localhost:80/login?oauth_token=1&oauth_verifier=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('uses location setting in callback_url when set in options', (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        location: 'https://differenthost:8888'
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('returns resource response stream', { parallel: false }, (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                                const client = new Bell.oauth.Client({
                                    name: 'twitter',
                                    provider: provider,
                                    clientId: 'test',
                                    clientSecret: 'secret'
                                });

                                const credentials = request.auth.credentials;
                                client.resource('GET', mock.uri + '/resource', null, { token: credentials.token, secret: credentials.secret, stream: true }, (err, res) => {

                                    expect(err).to.not.exist();
                                    return reply(res);
                                });
                            }
                        }
                    });

                    server.inject('/login?next=%2Fhome', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.result).to.equal('some text reply');
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('returns resource POST response', { parallel: false }, (done) => {

            const mock = new Mock.V1();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                                const client = new Bell.oauth.Client({
                                    name: 'twitter',
                                    provider: provider,
                                    clientId: 'test',
                                    clientSecret: 'secret'
                                });

                                const credentials = request.auth.credentials;
                                client.resource('POST', mock.uri + '/resource', { a: 5 }, { token: credentials.token, secret: credentials.secret, stream: true }, (err, res) => {

                                    expect(err).to.not.exist();
                                    return reply(res);
                                });
                            }
                        }
                    });

                    server.inject('/login?next=%2Fhome', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.result).to.equal('{"a":"5"}');
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('v2()', () => {

        it('authenticates an endpoint with provider parameters', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
                        mock.stop(done);
                    });
                });
            });
        });

        it('forces https in redirect_uri when set in options', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        providerParams: { special: true },
                        forceHttps: true
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

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A80%2Flogin&state=');
                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://localhost:80/login?code=1&state=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('uses location setting in redirect_uri when set in options', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        providerParams: { special: true },
                        location: 'https://differenthost:8888'
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

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('authenticates an endpoint with custom scope', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain('scope=a');
                        mock.stop(done);
                    });
                });
            });
        });

        it('authenticates an endpoint with runtime query parameters', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        providerParams: { special: true },
                        allowRuntimeProviderParams: true
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

                    server.inject('/login?runtime=5', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&runtime=5&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
                        mock.stop(done);
                    });
                });
            });
        });

        it('does not include runtime query parameters by default', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login?notallowed=b', (res) => {

                        expect(res.headers.location).to.not.contain('notallowed');
                        mock.stop(done);
                    });
                });
            });
        });

        it('errors on missing cookie in token step', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(cookie).to.exist();
                        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

                            server.inject(mockRes.headers.location, (response) => {

                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on mismatching state', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

                            server.inject({ url: mockRes.headers.location + 'xx', headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on failed token request', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on errored token request', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on invalid token request response', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('passes if the client secret is not modified in route', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: false,
                        clientId: Mock.CLIENT_ID_TESTER,
                        clientSecret: Mock.CLIENT_SECRET_TESTER,
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on failed profile request', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/v2.3/me', null);

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on errored profile request', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/v2.3/me', Boom.badRequest());

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on invalid profile request', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/v2.3/me', '{c');

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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                Mock.clear();
                                expect(response.statusCode).to.equal(500);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('errors on rejected query parameter', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

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

                    server.inject('/login?error=access_denied', (res) => {

                        expect(res.statusCode).to.equal(500);
                        done();
                    });
                });
            });
        });

        it('errors if isSecure is true when protocol is not https', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: true,
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
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        expect(res.statusCode).to.equal(500);
                        done();
                    });
                });
            });
        });

        it('passes if isSecure is true when protocol is https (location)', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: true,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        providerParams: { special: true },
                        location: 'https://differenthost:8888'
                    });

                    server.route({
                        method: '*',
                        path: '/login',
                        config: {
                            auth: 'custom',
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('passes if isSecure is true when protocol is https (forced)', (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    server.auth.strategy('custom', 'bell', {
                        password: 'password',
                        isSecure: true,
                        clientId: 'test',
                        clientSecret: 'secret',
                        provider: provider,
                        providerParams: { special: true },
                        forceHttps: true
                    });

                    server.route({
                        method: '*',
                        path: '/login',
                        config: {
                            auth: 'custom',
                            handler: (request, reply) => {

                                reply(request.auth.credentials);
                            }
                        }
                    });

                    server.inject('/login', (res) => {

                        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A80%2Flogin&state=');
                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            expect(mockRes.headers.location).to.contain('https://localhost:80/login?code=1&state=');

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                                expect(response.statusCode).to.equal(200);
                                mock.stop(done);
                            });
                        });
                    });
                });
            });
        });

        it('passes profile get params', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/v2.3/me', (uri) => {

                        Mock.clear();
                        expect(uri).to.equal('https://graph.facebook.com/v2.3/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => { });
                        });
                    });
                });
            });
        });

        it('passes profileParams', { parallel: false }, (done) => {

            const mock = new Mock.V2();
            mock.start((provider) => {

                const server = new Hapi.Server();
                server.connection({ host: 'localhost', port: 80 });
                server.register(Bell, (err) => {

                    expect(err).to.not.exist();

                    const custom = Bell.providers.facebook();
                    Hoek.merge(custom, provider);

                    Mock.override('https://graph.facebook.com/v2.3/me', (uri) => {

                        Mock.clear();
                        expect(uri).to.equal('https://graph.facebook.com/v2.3/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
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

                    server.inject('/login', (res) => {

                        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

                        mock.server.inject(res.headers.location, (mockRes) => {

                            server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => { });
                        });
                    });
                });
            });
        });
    });

    describe('Client', () => {

        it('accepts empty client secret', { parallel: false }, (done) => {

            const client = new OAuth.Client({ provider: Bell.providers.twitter() });
            expect(client.settings.clientSecret).to.equal('&');
            done();
        });

        describe('_request()', () => {

            it('errors on failed request', (done) => {

                Mock.override('http://example.com/', null);

                const client = new OAuth.Client({ provider: Bell.providers.twitter() });
                client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' }, (err, payload) => {

                    Mock.clear();
                    expect(err.message).to.equal('unknown');
                    done();
                });
            });

            it('errors on invalid response', (done) => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' }, (err, payload) => {

                    Mock.clear();
                    expect(err.message).to.equal('Received invalid payload from prov type endpoint: Unexpected token x');
                    done();
                });
            });

            it('errors on invalid response (no desc)', (done) => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret' }, (err, payload) => {

                    Mock.clear();
                    expect(err.message).to.equal('Received invalid payload from prov resource endpoint: Unexpected token x');
                    done();
                });
            });
        });

        describe('baseUri()', () => {

            it('removes default port', (done) => {

                expect(OAuth.Client.baseUri('http://example.com:80/x')).to.equal('http://example.com/x');
                expect(OAuth.Client.baseUri('https://example.com:443/x')).to.equal('https://example.com/x');
                done();
            });

            it('keeps non-default port', (done) => {

                expect(OAuth.Client.baseUri('http://example.com:8080/x')).to.equal('http://example.com:8080/x');
                expect(OAuth.Client.baseUri('https://example.com:8080/x')).to.equal('https://example.com:8080/x');
                done();
            });
        });

        describe('signature()', () => {

            it('generates RFC 5849 example', (done) => {

                const client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                const tokenSecret = 'dh893hdasih9';

                const params = {
                    b5: '=%3D',
                    a3: ['a', '2 q'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                const oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                const signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('r6/TJjbCOr97/+UU0NsvSne7s5g=');
                done();
            });

            it('handles array param with reveresed order', (done) => {

                const client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                const tokenSecret = 'dh893hdasih9';

                const params = {
                    b5: '=%3D',
                    a3: ['2 q', 'a'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                const oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                const signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('r6/TJjbCOr97/+UU0NsvSne7s5g=');
                done();
            });

            it('handles array param with same value', (done) => {

                const client = new OAuth.Client({ clientId: '9djdj82h48djs9d2', clientSecret: 'j49sk3j29djd', provider: Bell.providers.twitter() });
                const tokenSecret = 'dh893hdasih9';

                const params = {
                    b5: '=%3D',
                    a3: ['a', 'a'],
                    'c@': '',
                    a2: 'r b',
                    c2: ''
                };

                const oauth = {
                    oauth_consumer_key: '9djdj82h48djs9d2',
                    oauth_token: 'kkk9d7dh3k39sjv7',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                const signature = client.signature('post', 'http://example.com/request', params, oauth, tokenSecret);
                expect(signature).to.equal('dub5m7j8nN7KtHBochesFDQHea4=');
                done();
            });
        });

        describe('queryString()', () => {

            it('handles params with non-string values', (done) => {

                const params = {
                    a: [1, 2],
                    b: null,
                    c: [true, false],
                    d: Infinity
                };

                expect(OAuth.Client.queryString(params)).to.equal('a=1&a=2&b=&c=true&c=false&d=');
                done();
            });
        });
    });
});
