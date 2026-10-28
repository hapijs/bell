'use strict';

const Bell = require('../..');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const Mock = require('../mock');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('slack', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.slack();
        Hoek.merge(custom, mock.provider);

        const profile = {
            ok: true,
            url: 'https:\/\/example.slack.com\/',
            team: 'Example',
            user: 'cal',
            team_id: 'T12345',
            user_id: 'U12345'
        };

        Mock.override('https://slack.com/api/auth.test', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
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

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
        expect(res3.result).to.equal({
            provider: 'custom',
            token: '456',
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                access_token: '456',
                scope: undefined,
                user: 'cal',
                user_id: 'U12345',
                raw: profile
            }
        });
    });

    it('rejects an invalid code answered with ok:false', async (flags) => {

        flags.onCleanup = Mock.clear;

        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        Mock.override('https://slack.com/api/', (uri) => {

            if (uri.startsWith('https://slack.com/api/oauth.access')) {
                return { ok: false, error: 'invalid_code' };
            }

            return { ok: false, error: 'invalid_auth' };
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
            clientSecret: 'secret',
            provider: 'slack'
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: (request) => ({
                    marker: 'protected-callback-reached',
                    isAuthenticated: request.auth.isAuthenticated,
                    token: request.auth.credentials.token ?? null,
                    user_id: request.auth.credentials.profile?.user_id ?? null
                })
            }
        });

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
        const state = new URL(res1.headers.location).searchParams.get('state');

        const res2 = await server.inject({ url: `/login?code=attacker-controlled-invalid-code&state=${state}`, headers: { cookie } });
        expect(res2.statusCode).to.equal(500);
    });

    it('rejects a profile answered with ok:false', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.slack();
        Hoek.merge(custom, mock.provider);

        Mock.override('https://slack.com/api/auth.test', { ok: false, error: 'invalid_auth' });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
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

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
        expect(res3.statusCode).to.equal(500);
    });

    it('authenticates with mock (without extended profile)', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.slack({ extendedProfile: false });
        Hoek.merge(custom, mock.provider);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
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

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });

        expect(res3.result).to.equal({
            provider: 'custom',
            token: '456',
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                scope: undefined,
                access_token: '456'
            }
        });
    });
});
