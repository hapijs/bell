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


describe('twitter', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.twitter();
        Hoek.merge(custom, provider);

        Mock.override('https://api.twitter.com/1.1/users/show.json', {
            property: 'something'
        });

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
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result).to.equal({
            provider: 'custom',
            token: 'final',
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

        await mock.stop();
    });


    it('authenticates with mock and custom method', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.twitter({ getMethod: 'custom/method' });
        Hoek.merge(custom, provider);

        Mock.override('https://api.twitter.com/1.1/custom/method.json', {
            property: 'something'
        });

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
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result).to.equal({
            provider: 'custom',
            token: 'final',
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

        await mock.stop();
    });

    it('authenticates with mock and custom method with custom GET parameters', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.twitter({
            getMethod: 'custom/method',
            getParams: {
                param1: 'custom',
                param2: 'params'
            }
        });
        Hoek.merge(custom, provider);

        Mock.override('https://api.twitter.com/1.1/custom/method.json', {
            property: 'something'
        });

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
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result).to.equal({
            provider: 'custom',
            token: 'final',
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

        await mock.stop();
    });

    it('authenticates with mock (without extended profile)', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.twitter({ extendedProfile: false });
        Hoek.merge(custom, provider);

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
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        expect(response.result).to.equal({
            provider: 'custom',
            token: 'final',
            secret: 'secret',
            query: {},
            profile: {
                id: '1234567890',
                username: 'Steve Stevens'
            }
        });

        await mock.stop();
    });
});
