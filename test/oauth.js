'use strict';

const Crypto = require('crypto');

const Bell = require('..');
const Boom = require('@hapi/boom');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const OAuth = require('../lib/oauth');

const Mock = require('./mock');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


const privateKey = require('./constants.json').privateKey;


describe('Bell', () => {

    describe('v1()', () => {

        it('errors on missing oauth_verifier', async () => {

            const server = Hapi.server({ host: 'localhost', port: 8080 });
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
                options: {
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

            const server = Hapi.server({ host: 'localhost', port: 8080 });
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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?oauth_token=123&oauth_verifier=123');
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal('<html><head><meta http-equiv=\"refresh\" content=\"0;URL=\'http://localhost:8080/login?oauth_token=123&oauth_verifier=123&refresh=1\'\"></head><body></body></html>');
        });

        it('errors on missing cookie on token step (with refresh)', async () => {

            const server = Hapi.server({ host: 'localhost', port: 8080 });
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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?oauth_token=123&oauth_verifier=123&refresh=1');
            expect(res.statusCode).to.equal(500);
        });

        it('errors on rejected/denied query parameter', async () => {

            const server = Hapi.server({ host: 'localhost', port: 8080 });
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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?error=access_denied');
            expect(res.statusCode).to.equal(500);
            const res2 = await server.inject('/login?denied=true');
            expect(res2.statusCode).to.equal(500);
        });

        it('fails getting temporary credentials', async (flags) => {

            const mock = await Mock.v1(flags, { failTemporary: true });
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.statusCode).to.equal(500);
        });

        it('fails getting token credentials', async (flags) => {

            const mock = await Mock.v1(flags, { failToken: true });
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('passes credentials on error (temporary error)', async (flags) => {

            const mock = await Mock.v1(flags, { failTemporary: true });
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: {
                        strategy: 'custom',
                        mode: 'try'
                    },
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?some=thing');
            expect(res.result).to.equal({ provider: 'custom', query: { some: 'thing' } });
        });

        it('passes credentials on error (token error)', async (flags) => {

            const mock = await Mock.v1(flags, { failToken: true });
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: {
                        strategy: 'custom',
                        mode: 'try'
                    },
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login?some=thing');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.result).to.equal({ provider: 'custom', query: { some: 'thing' } });
        });

        it('does not pass on runtime query params by default', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?runtime=true');
            expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');
        });

        it('passes on runtime query params with allowRuntimeProviderParams', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                allowRuntimeProviderParams: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?runtime=true');
            expect(res.headers.location).to.equal(mock.uri + '/auth?oauth_token=1&runtime=true');
        });

        it('authenticates an endpoint via oauth with auth provider parameters', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.equal(mock.uri + '/auth?special=true&oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123&extra=true');
        });

        it('authenticates an endpoint via oauth with a function as provider parameters', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: (request) => ({ value: request.query.foo })
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login?foo=bar');
            expect(res1.headers.location).to.equal(mock.uri + '/auth?value=bar&oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123&extra=true');
        });

        it('passes profileParams', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.twitter();
            Hoek.merge(custom, mock.provider);

            const override = Mock.override('https://api.twitter.com/1.1/users/show.json', (uri) => {

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            await server.inject({ url: res2.headers.location, headers: { cookie } });

            await override;
        });

        it('errors on invalid resource request (mock Twitter)', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.twitter();
            Hoek.merge(custom, mock.provider);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('authenticates with mock Twitter with skip profile', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.twitter();
            Hoek.merge(custom, mock.provider);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });

            expect(res3.result).to.equal({
                provider: 'custom',
                token: 'final',
                secret: 'secret',
                query: {}
            });
        });

        it('errors on mismatching token', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

            await mock.server.inject(res1.headers.location);

            const res2 = await server.inject({ url: 'http://localhost:8080/login?oauth_token=2&oauth_verifier=123', headers: { cookie } });
            expect(res2.statusCode).to.equal(500);
        });

        it('errors if isSecure is true when protocol is not https', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: true,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.statusCode).to.equal(500);
        });

        it('passes if isSecure is true when protocol is https (forced)', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                isSecure: true,
                password: 'cookie_encryption_password_secure',
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                forceHttps: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://localhost:8080/login?oauth_token=1&oauth_verifier=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('passes if isSecure is true when protocol is https (location)', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: true,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                location: 'https://differenthost:8888'
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('forces https in callback_url when set in options', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                forceHttps: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://localhost:8080/login?oauth_token=1&oauth_verifier=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('uses location setting in callback_url when set in options', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                location: 'https://differenthost:8888'
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://differenthost:8888/login?oauth_token=1&oauth_verifier=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('returns resource response stream', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        const client = new Bell.oauth.Client({
                            name: 'twitter',
                            provider: mock.provider,
                            clientId: 'test',
                            clientSecret: 'secret'
                        });

                        const credentials = request.auth.credentials;
                        return client.resource('GET', mock.uri + '/resource', null, { token: credentials.token, secret: credentials.secret, stream: true });
                    }
                }
            });

            const res1 = await server.inject('/login?next=%2Fhome');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.result).to.equal('some text reply');
        });

        it('returns raw resource response', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: async function (request, h) {

                        const client = new Bell.oauth.Client({
                            name: 'twitter',
                            provider: mock.provider,
                            clientId: 'test',
                            clientSecret: 'secret'
                        });

                        const credentials = request.auth.credentials;
                        const { payload } = await client.resource('POST', mock.uri + '/resource', { a: 5 }, { token: credentials.token, secret: credentials.secret, raw: true });
                        return payload;
                    }
                }
            });

            const res1 = await server.inject('/login?next=%2Fhome');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.result).to.equal('{"a":"5"}');
        });

        it('returns resource POST response', async (flags) => {

            const mock = await Mock.v1(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        const client = new Bell.oauth.Client({
                            name: 'twitter',
                            provider: mock.provider,
                            clientId: 'test',
                            clientSecret: 'secret'
                        });

                        const credentials = request.auth.credentials;
                        return client.resource('POST', mock.uri + '/resource', { a: 5 }, { token: credentials.token, secret: credentials.secret, stream: true });
                    }
                }
            });

            const res1 = await server.inject('/login?next=%2Fhome');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.equal(mock.uri + '/auth?oauth_token=1');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.equal('http://localhost:8080/login?oauth_token=1&oauth_verifier=123');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.result).to.equal('{"a":"5"}');
        });
    });

    describe('v2()', () => {

        it('authenticates an endpoint with provider parameters', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
        });

        it('forces https in redirect_uri when set in options', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                forceHttps: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('uses location setting in redirect_uri when set in options', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                location: 'https://differenthost:8888'
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('ignores empty string returned by location setting (function)', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                location: () => ''
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
        });

        it('uses location setting (function) in redirect_uri when set in options', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                location: (request) => 'https://differenthost:8888' + request.path.replace(/(\/again)?$/, '/again')
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            server.route({
                method: '*',
                path: '/login/again',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin%2Fagain&state=');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://differenthost:8888/login/again?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('authenticates an endpoint with custom scope', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                scope: ['a']
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.headers.location).to.contain('scope=a');
        });

        it('authenticates an endpoint with custom function scope', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                scope: (request) => [request.query.scope]
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?scope=foo');
            expect(res.headers.location).to.contain('scope=foo');
        });

        it('authenticates with mock Instagram with skip profile', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.instagram();
            Hoek.merge(custom, mock.provider);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.result).to.equal({
                provider: 'custom',
                token: '456',
                refreshToken: undefined,
                expiresIn: 3600,
                query: {}
            });
        });

        it('authenticates an endpoint with runtime query parameters', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                allowRuntimeProviderParams: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?runtime=5');
            expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&runtime=5&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
        });

        it('authenticates an endpoint via oauth with plain PKCE', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const provider = Hoek.merge({ pkce: 'plain' }, mock.provider);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.artifacts;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
            expect(res1.headers.location).to.contain('code_challenge=');
            expect(res1.headers.location).to.contain('code_challenge_method=plain');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('http://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
            expect(res3.result.code_verifier).to.be.a.string();
            expect(res1.headers.location).to.contain(res3.result.code_verifier);
        });

        it('authenticates an endpoint via oauth with S256 PKCE', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const provider = Hoek.merge({ pkce: 'S256' }, mock.provider);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.artifacts;
                    }
                }
            });

            const res1 = await server.inject('/login?state=something');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
            expect(res1.headers.location).to.contain('code_challenge=');
            expect(res1.headers.location).to.contain('code_challenge_method=S256');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('http://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
            expect(res3.result.code_verifier).to.be.a.string();

            const hash = Crypto.createHash('sha256')
                .update(res3.result.code_verifier, 'ascii')
                .digest('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');

            expect(res1.headers.location).to.contain(hash);

        });

        it('allows runtime state', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                runtimeStateCallback: function (request) {

                    return request.query.state;
                }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?state=something');
            expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
            expect(res.headers.location).to.contain('something');
        });

        it('allows empty or null runtime state', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                runtimeStateCallback: function (request) {

                    return null;
                }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?state=something');
            expect(res.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
        });

        it('fails on missing state', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('http://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: 'http://localhost:8080/login?code=1', headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('does not include runtime query parameters by default', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login?notallowed=b');
            expect(res.headers.location).to.not.contain('notallowed');
        });

        it('refreshes & errors on missing cookie in token step', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(cookie).to.exist();
            expect(res1.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('http://localhost:8080/login?code=1&state=');

            const res3 = await server.inject(res2.headers.location);
            expect(res3.statusCode).to.equal(200);
            const newLocation = res2.headers.location + '&refresh=1';
            expect(res3.payload).to.contain(newLocation);

            const res4 = await server.inject(newLocation);
            expect(res4.statusCode).to.equal(500);
        });

        it('errors on mismatching state', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
            expect(res1.headers.location).to.contain(mock.uri + '/auth?client_id=test&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&state=');

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('http://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: 'http://localhost:8080/login?code=1&state=xx', headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on failed token request', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override(mock.provider.token, null);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on errored token request (500)', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override(mock.provider.token, Boom.badRequest());

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on errored token request (<200)', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            const error = Boom.badRequest();
            error.output.statusCode = 199;
            Mock.override(mock.provider.token, error);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on invalid token request response', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override(mock.provider.token, '{x');

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('passes if the client secret is not modified in route', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: Mock.CLIENT_ID_TESTER,
                clientSecret: Mock.CLIENT_SECRET_TESTER,
                provider: mock.provider
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('errors on failed profile request', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override('https://graph.facebook.com/v3.1/me', null);

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on errored profile request', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override('https://graph.facebook.com/v3.1/me', Boom.badRequest());

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on invalid profile request', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            Mock.override('https://graph.facebook.com/v3.1/me', '{c');

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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(500);
        });

        it('errors on rejected query parameter', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login?error=access_denied');
            expect(res1.statusCode).to.equal(500);

            const res2 = await server.inject('/login?error=access_denied&error_description="rejection"');
            expect(res2.statusCode).to.equal(500);

            const res3 = await server.inject('/login?denied="definitely"');
            expect(res3.statusCode).to.equal(500);
        });

        it('errors if isSecure is true when protocol is not https', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: true,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true }
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res = await server.inject('/login');
            expect(res.statusCode).to.equal(500);
        });

        it('passes if isSecure is true when protocol is https (location)', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: true,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                location: 'https://differenthost:8888'
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Fdifferenthost%3A8888%2Flogin&state=');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://differenthost:8888/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('passes if isSecure is true when protocol is https (forced)', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: true,
                clientId: 'test',
                clientSecret: 'secret',
                provider: mock.provider,
                providerParams: { special: true },
                forceHttps: true
            });

            server.route({
                method: '*',
                path: '/login',
                options: {
                    auth: 'custom',
                    handler: (request, h) => {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            expect(res1.headers.location).to.contain(mock.uri + '/auth?special=true&client_id=test&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Flogin&state=');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);
            expect(res2.headers.location).to.contain('https://localhost:8080/login?code=1&state=');

            const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
            expect(res3.statusCode).to.equal(200);
        });

        it('passes profile get params', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            const override = Mock.override('https://graph.facebook.com/v3.1/me', (uri) => {

                expect(uri).to.equal('https://graph.facebook.com/v3.1/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            await server.inject({ url: res2.headers.location, headers: { cookie } });

            await override;
        });

        it('passes profileParams', async (flags) => {

            const mock = await Mock.v2(flags);
            const server = Hapi.server({ host: 'localhost', port: 8080 });
            await server.register(Bell);

            const custom = Bell.providers.facebook();
            Hoek.merge(custom, mock.provider);

            const override = Mock.override('https://graph.facebook.com/v3.1/me', (uri) => {

                expect(uri).to.equal('https://graph.facebook.com/v3.1/me?appsecret_proof=d32b1d35fd115c4a496e06fd8df67eed8057688b17140a2cef365cb235817102&fields=id%2Cemail%2Cpicture%2Cname%2Cfirst_name%2Cmiddle_name%2Clast_name%2Clink%2Clocale%2Ctimezone%2Cupdated_time%2Cverified%2Cgender');
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
                options: {
                    auth: 'custom',
                    handler: function (request, h) {

                        return request.auth.credentials;
                    }
                }
            });

            const res1 = await server.inject('/login');
            const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

            const res2 = await mock.server.inject(res1.headers.location);

            await server.inject({ url: res2.headers.location, headers: { cookie } });

            await override;
        });
    });

    describe('Client', () => {

        it('accepts empty client secret', () => {

            const client = new OAuth.Client({ provider: Bell.providers.twitter() });
            expect(client.settings.clientSecret).to.equal('&');
        });

        describe('_request()', () => {

            it('errors on failed request', async () => {

                Mock.override('http://example.com/', null);

                const client = new OAuth.Client({ provider: Bell.providers.twitter() });
                await expect(client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' })).to.reject('Failed obtaining undefined type');

                Mock.clear();
            });

            it('errors on invalid response', async () => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                await expect(client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret', desc: 'type' })).to.reject('Received invalid payload from prov type endpoint');

                Mock.clear();
            });

            it('errors on invalid response (no desc)', async () => {

                Mock.override('http://example.com/', '{x');

                const client = new OAuth.Client({ name: 'prov', provider: Bell.providers.twitter() });
                await expect(client._request('get', 'http://example.com/', null, { oauth_token: 'xcv' }, { secret: 'secret' })).to.reject('Received invalid payload from prov resource endpoint');

                Mock.clear();
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
