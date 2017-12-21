'use strict';

// Load modules

const Bell = require('../../');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();


describe('pingfed', () => {

    it('authenticates with mock', {
        parallel: false
    }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({
            host: 'localhost',
            port: 80
        });
        await server.register(Bell);



        const custom = Bell.providers.pingfed();
        Hoek.merge(custom, provider);

        const profile = {
            id: 'steve.smith@example.com',
            displayName: 'steve.smith@example.com',
            username: 'steve.smith@example.com',
            email: 'steve.smith@example.com',
            sub: 'steve.smith@example.com'
        };
        // need to fix this
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

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({
            url: mockRes.headers.location,
            headers: {
                cookie
            }
        });

        Mock.clear();
        expect(response.result).to.equal({
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

        await mock.stop();
    });

    it('authenticates with mock and custom uri ', {
        parallel: false
    }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({
            host: 'localhost',
            port: 80
        });
        await server.register(Bell);



        const custom = Bell.providers.pingfed({ uri: 'https://login-dev.ext.hpe.com' });
        Hoek.merge(custom, provider);

        const profile = {
            id: 'steve.smith@example.com',
            displayName: 'steve.smith@example.com',
            username: 'steve.smith@example.com',
            email: 'steve.smith@example.com',
            sub: 'steve.smith@example.com'
        };
        // need to fix this
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

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({
            url: mockRes.headers.location,
            headers: {
                cookie
            }
        });

        Mock.clear();
        expect(response.result).to.equal({
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

        await mock.stop();
    });
});
