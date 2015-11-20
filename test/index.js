'use strict';

// Load modules

const Bell = require('../');
const Boom = require('boom');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Sinon = require('sinon');
const Mock = require('./mock');
const OAuth = require('../lib/oauth');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Bell', () => {

    it('supports string representations of boolean and number strategy options', (done) => {

        const mock = new Mock.V1();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const spy = Sinon.spy(OAuth, 'v1');

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: 'false',
                    clientId: 'test',
                    clientSecret: 'secret',
                    ttl: '1234567890',
                    forceHttps: 'true',
                    provider: provider,
                    config: {
                        testNoBoolean: 'false',
                        testNoNumber: '0987654321'
                    }
                });

                expect(spy.calledOnce).to.be.true();
                expect(spy.getCall(0).args[0]).to.be.an.object();
                expect(spy.getCall(0).args[0].isSecure).to.be.false();
                expect(spy.getCall(0).args[0].ttl).to.be.equal(1234567890);
                expect(spy.getCall(0).args[0].forceHttps).to.be.true();
                expect(spy.getCall(0).args[0].config.testNoBoolean).to.be.equal('false');
                expect(spy.getCall(0).args[0].config.testNoNumber).to.be.equal('0987654321');

                spy.restore();

                mock.stop(done);
            });
        });
    });

    it('authenticates an endpoint via oauth', (done) => {

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

                server.inject('/login?next=%2Fhome', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

                    mock.server.inject(res.headers.location, (mockRes) => {

                        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            expect(response.result.provider).to.equal('custom');
                            expect(response.result.query.next).to.equal('/home');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates an endpoint via oauth2', (done) => {

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

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            expect(response.result.provider).to.equal('custom');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates an endpoint via oauth2 and basic authentication', (done) => {

        const mock = new Mock.V2(false);
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

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            expect(response.result.provider).to.equal('custom');
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('overrides cookie name', (done) => {

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

                server.inject('/login', (res) => {

                    expect(res.headers['set-cookie'][0]).to.contain('ring=');
                    mock.stop(done);
                });
            });
        });
    });

    it('allows multiple custom provider names', (done) => {

        const mock = new Mock.V1();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                server.auth.strategy('custom_1', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: Hoek.merge(Hoek.clone(provider), { name: 'custom_1' }),
                    cookie: 'ring_1'
                });

                server.auth.strategy('custom_2', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: Hoek.merge(Hoek.clone(provider), { name: 'custom_2' }),
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

                server.inject('/login_1', (res) => {

                    expect(res.headers['set-cookie'][0]).to.contain('ring_1=');
                    server.inject('/login_2', (response) => {

                        expect(response.headers['set-cookie'][0]).to.contain('ring_2=');
                        mock.stop(done);
                    });
                });
            });
        });
    });

    it('exposes OAuth implementation', (done) => {

        expect(Bell.oauth.Client).to.be.function();
        done();
    });

    it('exposes OAuth via plugin', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'localhost', port: 80 });
        server.register(Bell, (err) => {

            expect(server.plugins.bell.oauth.Client).to.be.function();
            done();
        });
    });

    it('allows null for cookie domain value', (done) => {

        const mock = new Mock.V1();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const spy = Sinon.spy(OAuth, 'v1');

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: 'false',
                    clientId: 'test',
                    clientSecret: 'secret',
                    ttl: '1234567890',
                    forceHttps: 'true',
                    provider: provider,
                    domain: null
                });

                expect(spy.calledOnce).to.be.true();
                expect(spy.getCall(0).args[0]).to.be.an.object();
                expect(spy.getCall(0).args[0].isSecure).to.be.false();
                expect(spy.getCall(0).args[0].ttl).to.be.equal(1234567890);
                expect(spy.getCall(0).args[0].forceHttps).to.be.true();
                expect(spy.getCall(0).args[0].domain).to.be.null();

                spy.restore();

                mock.stop(done);
            });
        });
    });

    describe('simulate()', () => {

        it('authenticates an endpoint via oauth', { parallel: false }, (done) => {

            Bell.simulate((request, next) => {

                return next(null, { some: 'value' });
            });

            const server = new Hapi.Server();
            server.connection();
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                server.auth.strategy('twitter', 'bell', {
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
                        auth: 'twitter',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login?next=%2Fhome', (res) => {

                    expect(res.result).to.deep.equal({
                        provider: 'twitter',
                        token: 'oauth_token',
                        query: {
                            next: '/home'
                        },
                        secret: 'token_secret',
                        some: 'value'
                    });

                    Bell.simulate(false);
                    done();
                });
            });
        });

        it('authenticates an endpoint via oauth2', { parallel: false }, (done) => {

            Bell.simulate((request, next) => {

                return next(null, { some: 'value' });
            });

            const server = new Hapi.Server();
            server.connection();
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                server.auth.strategy('github', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'test',
                    clientSecret: 'secret',
                    provider: 'github'
                });

                server.route({
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'github',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login?next=%2Fhome', (res) => {

                    expect(res.result).to.deep.equal({
                        provider: 'github',
                        token: 'oauth_token',
                        query: {
                            next: '/home'
                        },
                        refreshToken: 'refresh_token',
                        expiresIn: 3600,
                        some: 'value'
                    });

                    Bell.simulate(false);
                    done();
                });
            });
        });

        it('simulates error', { parallel: false }, (done) => {

            Bell.simulate((request, next) => {

                return next(Boom.badRequest());
            });

            const server = new Hapi.Server();
            server.connection();
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                server.auth.strategy('twitter', 'bell', {
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
                        auth: 'twitter',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login?next=%2Fhome', (res) => {

                    expect(res.statusCode).to.equal(400);

                    Bell.simulate(false);
                    done();
                });
            });
        });
    });
});
