'use strict';

// Load modules

const Bell = require('../');
const Boom = require('boom');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Sinon = require('sinon');
const Mock = require('./mock');
const OAuth = require('../lib/oauth');


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();


const privateKey = require('./constants.json').privateKey;

describe('Bell', () => {

    it('supports string representations of boolean and number strategy options', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const spy = Sinon.spy(OAuth, 'v1');

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: 'false',
            clientId: 'test',
            clientSecret: 'secret',
            ttl: '1234567890',
            forceHttps: 'true',
            provider,
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

        mock.stopasync();
    });

    it('authenticates an endpoint via oauth', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login?next=%2Fhome');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        expect(response.result.query.next).to.equal('/home');
        mock.stopasync();
    });

    it('authenticates an endpoint via oauth using RSA-SHA1 signing', async () => {

        const mock = new Mock.V1({ signatureMethod: 'RSA-SHA1' });
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: privateKey,
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login?next=%2Fhome');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        expect(response.result.query.next).to.equal('/home');
        mock.stopasync();
    });

    it('authenticates an endpoint via oauth2', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        mock.stopasync();
    });

    it('authenticates an endpoint via oauth2 and basic authentication', async () => {

        const mock = new Mock.V2({ useParamsAuth: false });
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        mock.stopasync();
    });

    it('authenticates an endpoint via oauth2 with custom client secret options', async () => {

        const mock = new Mock.V2(false);
        const provider = await mock.start();

        const server = new Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'customSecret',
            clientSecret: { headers: { mycustomtoken: 'mycustomtoken' } },
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=customSecret&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        expect(response.result.token).to.equal('mycustomtoken');
        mock.stopasync();
    });

    it('authenticates an endpoint via oauth2 with custom client secret options and params auth', async () => {

        const mock = new Mock.V2(true); // will set useParamsAuth = true
        const provider = await mock.start();

        const server = new Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'customSecret',
            clientSecret: { headers: { mycustomtoken: 'mycustomtoken' } },
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=customSecret&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

        const mockRes = await mock.server.inject(res.headers.location);

        expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result.provider).to.equal('custom');
        expect(response.result.token).to.equal('mycustomtoken');
        mock.stopasync();
    });

    it('overrides cookie name', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            cookie: 'ring'
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        expect(res.headers['set-cookie'][0]).to.contain('ring=');
        mock.stopasync();
    });

    it('allows multiple custom provider names', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        server.auth.strategy('custom_1', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider: Hoek.merge(Hoek.clone(provider), { name: 'custom_1' }),
            cookie: 'ring_1'
        });

        server.auth.strategy('custom_2', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        server.route({
            method: '*',
            path: '/login_2',
            config: {
                auth: 'custom_2',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login_1');

        expect(res.headers['set-cookie'][0]).to.contain('ring_1=');
        server.inject('/login_2', (response) => {

            expect(response.headers['set-cookie'][0]).to.contain('ring_2=');
            mock.stopasync();
        });
    });

    it('exposes OAuth implementation', () => {

        expect(Bell.oauth.Client).to.be.function();
    });

    it('exposes OAuth via plugin', async () => {

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);
        expect(server.plugins.bell.oauth.Client).to.be.function();
    });

    it('allows null for cookie domain value', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const spy = Sinon.spy(OAuth, 'v1');

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: 'false',
            clientId: 'test',
            clientSecret: 'secret',
            ttl: '1234567890',
            forceHttps: 'true',
            provider,
            domain: null
        });

        expect(spy.calledOnce).to.be.true();
        expect(spy.getCall(0).args[0]).to.be.an.object();
        expect(spy.getCall(0).args[0].isSecure).to.be.false();
        expect(spy.getCall(0).args[0].ttl).to.be.equal(1234567890);
        expect(spy.getCall(0).args[0].forceHttps).to.be.true();
        expect(spy.getCall(0).args[0].domain).to.be.null();

        spy.restore();

        mock.stopasync();
    });

    describe('simulate()', () => {

        it('authenticates an endpoint via oauth', { parallel: false }, async () => {

            Bell.simulate((request, next) => {

                return next(null, { some: 'value' });
            });

            const server = Server();
            await server.register(Bell);



            server.auth.strategy('twitter', 'bell', {
                password: 'cookie_encryption_password_secure',
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
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?next=%2Fhome');

            expect(res.result).to.equal({
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


        it('authenticates an endpoint via oauth2', { parallel: false }, async () => {

            Bell.simulate((request, next) => {

                return next(null, { some: 'value' });
            });

            const server = Server();
            await server.register(Bell);



            server.auth.strategy('github', 'bell', {
                password: 'cookie_encryption_password_secure',
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
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?next=%2Fhome');

            expect(res.result).to.equal({
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

        it('simulates error', { parallel: false }, async () => {

            Bell.simulate((request, next) => {

                return next(Boom.badRequest());
            });

            const server = Server();
            await server.register(Bell);



            server.auth.strategy('twitter', 'bell', {
                password: 'cookie_encryption_password_secure',
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
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?next=%2Fhome');

            expect(res.statusCode).to.equal(400);

            Bell.simulate(false);
            done();
        });
    });
});
