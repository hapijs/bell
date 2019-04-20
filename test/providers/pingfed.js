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


describe('pingfed', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.pingfed();
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: 'steve.smith@example.com',
            displayName: 'steve.smith@example.com',
            username: 'steve.smith@example.com',
            email: 'steve.smith@example.com',
            sub: 'steve.smith@example.com'
        };

        Mock.override('https://login-dev.ext.hpe.com/idp/userinfo.openid', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'pingfed',
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
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: 'steve.smith@example.com',
                displayName: 'steve.smith@example.com',
                username: 'steve.smith@example.com',
                email: 'steve.smith@example.com',
                raw: profile
            }
        });
    });

    it('authenticates with mock and custom uri ', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.pingfed({ uri: 'https://login-dev.ext.hpe.com' });
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: 'steve.smith@example.com',
            displayName: 'steve.smith@example.com',
            username: 'steve.smith@example.com',
            email: 'steve.smith@example.com',
            sub: 'steve.smith@example.com'
        };

        Mock.override('https://login-dev.ext.hpe.com/idp/userinfo.openid', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'pingfed',
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
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: 'steve.smith@example.com',
                displayName: 'steve.smith@example.com',
                username: 'steve.smith@example.com',
                email: 'steve.smith@example.com',
                raw: profile
            }
        });
    });
});
