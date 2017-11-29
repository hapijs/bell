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


describe('salesforce', () => {

    it('fails with extendedProfile false and identityServiceProfile true', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const throws = () => {

            Bell.providers.salesforce({ extendedProfile: false, identityServiceProfile: true });
        };

        expect(throws).to.throw(Error);

        await mock.stop();
    });

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.salesforce();

        expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
        expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

        Hoek.merge(custom, provider);

        const profile = {
            user_id: '1234567890',
            username: 'steve',
            display_name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('https://login.salesforce.com/services/oauth2/userinfo', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'salesforce',
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
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile
        });
        await mock.stop();
    });

    it('authenticates with mock and custom uri', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.salesforce({ identityServiceProfile: true });

        expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
        expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

        Hoek.merge(custom, provider);

        const profile = {
            user_id: '1234567890',
            username: 'steve',
            display_name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('https://login.salesforce.com/id/foo/bar', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'salesforce',
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
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile
        });
        await mock.stop();
    });

    it('authenticates with mock and identityServiceProfile', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.salesforce({ uri: 'http://example.com' });

        expect(custom.auth).to.equal('http://example.com/services/oauth2/authorize');
        expect(custom.token).to.equal('http://example.com/services/oauth2/token');

        Hoek.merge(custom, provider);

        const profile = {
            user_id: '1234567890',
            username: 'steve',
            display_name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('http://example.com/services/oauth2/userinfo', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'salesforce',
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
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile
        });
        await mock.stop();
    });

    it('authenticates with mock (without extended profile)', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.salesforce({ extendedProfile: false });

        expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
        expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

        Hoek.merge(custom, provider);

        const profile = {
            user_id: '1234567890',
            username: 'steve',
            display_name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('https://login.salesforce.com/services/oauth2/userinfo', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'salesforce',
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
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {}
        });
        await mock.stop();
    });
});
