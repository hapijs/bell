'use strict';

// Load modules

const Bell = require('../');
const Boom = require('boom');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('./mock');
const OAuth = require('../lib/oauth');


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const privateKey = require('./constants.json').privateKey;

describe('Bell', () => {

    describe('v1()', () => {

        it('errors on missing oauth_verifier', async () => {

            const server = Server({ host: 'localhost', port: 80 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
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
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?oauth_token=123');
            expect(res.statusCode).to.equal(500);
        });

        it('attempts to perform html redirection on missing cookie on token step', async () => {

            const server = Server({ host: 'localhost', port: 80 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
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
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?oauth_token=123&oauth_verifier=123');
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal('<html><head><meta http-equiv=\"refresh\" content=\"0;URL=\'http://localhost:80/login?oauth_token=123&oauth_verifier=123&refresh=1\'\"></head><body></body></html>');
        });
    });

    it('errors on missing cookie on token step (with refresh)', async () => {

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
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
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login?oauth_token=123&oauth_verifier=123&refresh=1');
        expect(res.statusCode).to.equal(500);
    });

    it('errors on rejected query parameter', async () => {

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
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
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login?error=access_denied');
        expect(res.statusCode).to.equal(500);
    });

    it('fails getting temporary credentials', async () => {

        const mock = new Mock.V1({ failTemporary: true });
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
        expect(res.statusCode).to.equal(500);
        await mock.stop();
    });

    it('fails getting token credentials', async () => {

        const mock = new Mock.V1({ failToken: true });
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80, debug: { log: ['error'], request: ['error', 'implementation'] } });
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
        console.log(res.payload, res.headers);
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('does not pass on runtime query params by default', async () => {

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

        const res = await server.inject('/login?runtime=true');
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');
        await mock.stop();
    });

    it('passes on runtime query params with allowRuntimeProviderParams', async () => {

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
            allowRuntimeProviderParams: true
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

        const res = await server.inject('/login?runtime=true');
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1&runtime=true');
        await mock.stop();
    });

    it('authenticates an endpoint via oauth with auth provider parameters', async () => {

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
            providerParams: { special: true }
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
        expect(res.headers.location).to.equal(mock.uri + '/auth?special=true&oauth_token=1');

        const response = await mock.server.inject(res.headers.location);
        expect(response.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123&extra=true');
        await mock.stop();
    });

    it('authenticates an endpoint via oauth with a function as provider parameters', async () => {

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
            providerParams: (request) => ({ value: request.query.foo })
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

        const res = await server.inject('/login?foo=bar');
        expect(res.headers.location).to.equal(mock.uri + '/auth?value=bar&oauth_token=1');

        const response = await mock.server.inject(res.headers.location);
        expect(response.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123&extra=true');
        await mock.stop();
    });

    it('passes profileParams', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.twitter();
        Hoek.merge(custom, provider);

        Mock.override('https://api.twitter.com/1.1/users/show.json', (uri) => {

            expect(uri).to.equal('https://api.twitter.com/1.1/users/show.json?user_id=1234567890&fields=id%2Cemail');
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        Mock.clear();
        await mock.stop();
    });

    it('authenticates with mock Twitter', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.twitter();
        Hoek.merge(custom, provider);

        Mock.override('https://api.twitter.com/1.1/users/show.json', Boom.badRequest());

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('authenticates with mock Twitter with skip profile', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.twitter();
        Hoek.merge(custom, provider);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'twitter',
            clientSecret: 'secret',
            provider: custom,
            skipProfile: true
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

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result).to.equal({
            provider: 'custom',
            token: 'final',
            secret: 'secret',
            query: {}
        });

        await mock.stop();
    });

    it('errors on mismatching token', async () => {

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

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: 'http://localhost:80/login?oauth_token=2&oauth_verifier=123', headers: { cookie } });
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors if isSecure is true when protocol is not https', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: true,
            clientId: 'test',
            clientSecret: 'secret',
            provider
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        expect(res.statusCode).to.equal(500);
    });

    it('passes if isSecure is true when protocol is https (forced)', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            isSecure: true,
            password: 'cookie_encryption_password_secure',
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            forceHttps: true
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://localhost:80/login?oauth_token=1&oauth_verifier=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('passes if isSecure is true when protocol is https (location)', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: true,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            location: 'https://differenthost:8888'
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('forces https in callback_url when set in options', async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            forceHttps: true
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

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://localhost:80/login?oauth_token=1&oauth_verifier=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('uses location setting in callback_url when set in options', async () => {

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
            location: 'https://differenthost:8888'
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

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('returns resource response stream', { parallel: false }, async () => {

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
                handler: async function (request, h) {

                    const client = new Bell.oauth.Client({
                        name: 'twitter',
                        provider,
                        clientId: 'test',
                        clientSecret: 'secret'
                    });

                    const credentials = request.auth.credentials;
                    const res = await client.resource('GET', mock.uri + '/resource', null, { token: credentials.token, secret: credentials.secret, stream: true });
                    return h.response(res);
                }
            }
        });

        const res = await server.inject('/login?next=%2Fhome');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.result).to.equal('some text reply');
        await mock.stop();
    });

    it('returns raw resource response', { parallel: false }, async () => {

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
                handler: async function (request, h) {

                    const client = new Bell.oauth.Client({
                        name: 'twitter',
                        provider,
                        clientId: 'test',
                        clientSecret: 'secret'
                    });

                    const credentials = request.auth.credentials;
                    const res = await client.resource('POST', mock.uri + '/resource', { a: 5 }, { token: credentials.token, secret: credentials.secret, raw: true });
                    return h.response(res);
                }
            }
        });

        const res = await server.inject('/login?next=%2Fhome');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.result).to.equal('{"a":"5"}');
        await mock.stop();
    });

    it('returns resource POST response', { parallel: false }, async () => {

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
                handler: async function (request, h) {

                    const client = new Bell.oauth.Client({
                        name: 'twitter',
                        provider,
                        clientId: 'test',
                        clientSecret: 'secret'
                    });

                    const credentials = request.auth.credentials;
                    const res = await client.resource('POST', mock.uri + '/resource', { a: 5 }, { token: credentials.token, secret: credentials.secret, stream: true });
                    return reply(res);
                }
            }
        });

        const res = await server.inject('/login?next=%2Fhome');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.equal('http://localhost:80/login?oauth_token=1&oauth_verifier=123');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.result).to.equal('{"a":"5"}');
        await mock.stop();
    });
});

describe('v2()', () => {

    it('authenticates an endpoint with provider parameters', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true }
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

        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        await mock.stop();
    });

    it('forces https in redirect_uri when set in options', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            forceHttps: true
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
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('uses location setting in redirect_uri when set in options', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            location: 'https://differenthost:8888'
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
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });


    it('ignores empty string returned by location setting (function)', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            location: () => ''
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
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        await mock.stop();
    });

    it('uses location setting (function) in redirect_uri when set in options', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            location: (request) => 'https://differenthost:8888' + request.path.replace(/(\/again)?$/, '/again')
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

        server.route({
            method: '*',
            path: '/login/again',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin%2Fagain&state=');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://differenthost:8888/login/again?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('authenticates an endpoint with custom scope', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            scope: ['a']
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
        expect(res.headers.location).to.contain('scope=a');
        await mock.stop();
    });

    it('authenticates an endpoint with custom function scope', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            scope: (request) => [request.query.scope]
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

        const res = await server.inject('/login?scope=foo');
        expect(res.headers.location).to.contain('scope=foo');
        await mock.stop();
    });

    it('authenticates with mock Instagram with skip profile', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.instagram();
        Hoek.merge(custom, provider);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'instagram',
            clientSecret: 'secret',
            provider: custom,
            skipProfile: true
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

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            refreshToken: undefined,
            expiresIn: 3600,
            query: {}
        });

        await mock.stop();
    });

    it('authenticates an endpoint with runtime query parameters', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            allowRuntimeProviderParams: true
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

        const res = await server.inject('/login?runtime=5');

        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&runtime=5&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        await mock.stop();
    });

    it('allows runtime state', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            runtimeStateCallback: function (request) {

                return request.query.state;
            }
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

        const res = await server.inject('/login?state=something');
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        expect(res.headers.location).to.contain('something');
        await mock.stop();
    });

    it('allows empty or null runtime state', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            runtimeStateCallback: function (request) {

                return null;
            }
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

        const res = await server.inject('/login?state=something');

        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        await mock.stop();
    });

    it('fails on missing state', async () => {

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

        const response = await server.inject({ url: 'http://localhost:80/login?code=1', headers: { cookie } });
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('does not include runtime query parameters by default', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true }
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

        const res = await server.inject('/login?notallowed=b');
        expect(res.headers.location).to.not.contain('notallowed');
        await mock.stop();
    });

    it('refreshes & errors on missing cookie in token step', async () => {

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
        expect(cookie).to.exist();
        expect(res.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Flogin&state=');

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('http://localhost:80/login?code=1&state=');

        const response = await server.inject(mockRes.headers.location);
        expect(response.statusCode).to.equal(200);
        const newLocation = mockRes.headers.location + '&refresh=1';
        expect(response.payload).to.contain(newLocation);

        const errorResponse = await server.inject(newLocation);
        expect(errorResponse.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on mismatching state', async () => {

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

        const response = await server.inject({ url: 'http://localhost:80/login?code=1&state=xx', headers: { cookie } });
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on failed token request', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override(provider.token, null);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on errored token request (500)', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override(provider.token, Boom.badRequest());

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on errored token request (<200)', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        const error = Boom.badRequest();
        error.output.statusCode = 199;
        Mock.override(provider.token, error);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on invalid token request response', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override(provider.token, '{x');

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('passes if the client secret is not modified in route', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: Mock.CLIENT_ID_TESTER,
            clientSecret: Mock.CLIENT_SECRET_TESTER,
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

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('errors on failed profile request', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override('https://graph.facebook.com/v2.9/me', null);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on errored profile request', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override('https://graph.facebook.com/v2.9/me', Boom.badRequest());

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on invalid profile request', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override('https://graph.facebook.com/v2.9/me', '{c');

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.statusCode).to.equal(500);
        await mock.stop();
    });

    it('errors on rejected query parameter', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true }
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

        const res = await server.inject('/login?error=access_denied');
        expect(res.statusCode).to.equal(500);

        const res2 = await server.inject('/login?error=access_denied&error_description="rejection"');
        expect(res2.statusCode).to.equal(500);
        const res3 = await server.inject('/login?denied="definitely"');

        expect(res3.statusCode).to.equal(500);
    });

    it('errors if isSecure is true when protocol is not https', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: true,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true }
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        expect(res.statusCode).to.equal(500);
    });

    it('passes if isSecure is true when protocol is https (location)', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: true,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            location: 'https://differenthost:8888'
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('passes if isSecure is true when protocol is https (forced)', async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: true,
            clientId: 'test',
            clientSecret: 'secret',
            provider,
            providerParams: { special: true },
            forceHttps: true
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request, h) => {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A80%2Flogin&state=');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        expect(mockRes.headers.location).to.contain('https://localhost:80/login?code=1&state=');

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        expect(response.statusCode).to.equal(200);
        await mock.stop();
    });

    it('passes profile get params', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override('https://graph.facebook.com/v2.9/me', (uri) => {

            expect(uri).to.equal('https://graph.facebook.com/v2.9/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        Mock.clear();
        await mock.stop();
    });

    it('passes profileParams', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        Mock.override('https://graph.facebook.com/v2.9/me', (uri) => {

            expect(uri).to.equal('https://graph.facebook.com/v2.9/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res = await server.inject('/login');
        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';

        const mockRes = await mock.server.inject(res.headers.location);
        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });
        Mock.clear();
        await mock.stop();
    });


    describe('Client', () => {

        it('accepts empty client secret', { parallel: false }, () => {

            const client = new OAuth.Client({ provider: Bell.providers.twitter() });
            expect(client.settings.clientSecret).to.equal('&');
        });

        describe('_request()', () => {

            it('errors on failed request', async () => {

                Mock.override('http://example.com/', null);

                const client = new OAuth.Client({ provider: Bell.providers.twitter() });
                try {
                    const payload = await client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' });
                    expect(payload).to.not.exist();
                }
                catch (err) {
                    expect(err.message).to.equal('unknown');
                }
                finally {
                    Mock.clear();
                }



            });

            it('errors on invalid response', async () => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                try {
                    const payload = await client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' });
                    expect(payload).to.not.exist();
                }
                catch (err) {
                    expect(err.message).to.startWith('Received invalid payload from prov type endpoint: Unexpected token x');
                }
                finally {
                    Mock.clear();
                }

            });

            it('errors on invalid response (no desc)', async () => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                try {
                    const payload = client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret' });
                    expect(payload).to.not.exist();
                }
                catch (err) {
                    expect(err.message).to.startWith('Received invalid payload from prov resource endpoint: Unexpected token x');
                }
                finally {
                    Mock.clear();
                }
            });
        });

        describe('baseUri()', () => {

            it('removes default port', () => {

                expect(OAuth.Client.baseUri('http://example.com:80/x')).to.equal('http://example.com/x');
                expect(OAuth.Client.baseUri('https://example.com:443/x')).to.equal('https://example.com/x');
            });

            it('keeps non-default port', () => {

                expect(OAuth.Client.baseUri('http://example.com:8080/x')).to.equal('http://example.com:8080/x');
                expect(OAuth.Client.baseUri('https://example.com:8080/x')).to.equal('https://example.com:8080/x');
            });
        });

        describe('signature()', () => {

            it('generates RFC 5849 example', () => {

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
            });

            it('computes RSA-SHA1 signature', () => {

                const client = new OAuth.Client({
                    clientId: '9djdj82h48djs9d2',
                    clientSecret: privateKey,
                    provider: {
                        protocol: 'oauth',
                        auth: 'https://example.com/oauth/authorize',
                        token: 'https://example.com/oauth/access-token',
                        temporary: 'https://example.com/oauth/request-token',
                        signatureMethod: 'RSA-SHA1'
                    }
                });

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
                    oauth_signature_method: 'RSA-SHA1',
                    oauth_timestamp: '137131201',
                    oauth_nonce: '7d8f3e4a'
                };

                const signature = client.signature('get', 'http://example.com/request', params, oauth, privateKey);
                expect(signature).to.equal('mUUxSJS/cfLML3eZMlLK7eYxN36hWeBf4gGkAQbEc0bjz2GTH7YVaW2bQ+wwkHuWwxOTSLD70FJxVV4fmGIyw+/l7kt1FaJepL3Uc7IcARhUzsdT9HXRcHFjRkyDvBSssZA6LksQjGyblpYv5LXtUtVTm+IFR19ZwovFjIvNBxM=');
            });

            it('handles array param with reveresed order', () => {

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
            });

            it('handles array param with same value', () => {

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
            });
        });

        describe('queryString()', () => {

            it('handles params with non-string values', () => {

                const params = {
                    a: [1, 2],
                    b: null,
                    c: [true, false],
                    d: Infinity
                };

                expect(OAuth.Client.queryString(params)).to.equal('a=1&a=2&b=&c=true&c=false&d=');
            });
        });
    });
});