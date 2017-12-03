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

describe('facebook', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.facebook();
        Hoek.merge(custom, provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('https://graph.facebook.com/v2.9/me', profile);

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
        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                username: 'steve',
                displayName: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith',
                    middle: undefined
                },
                email: 'steve@example.com',
                raw: profile
            }
        });

        await mock.stop();
    });


    it('authenticates with mock (with custom fields)', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.facebook({ fields: 'id,name,email,first_name,last_name,middle_name,picture' });
        Hoek.merge(custom, provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com',
            picture: {
                data: {
                    is_silhouette: false,
                    url: 'https://example.com/profile.png'
                }
            }
        };

        Mock.override('https://graph.facebook.com/v2.9/me', profile);

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
        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                username: 'steve',
                displayName: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith',
                    middle: undefined
                },
                email: 'steve@example.com',
                raw: profile
            }
        });

        await mock.stop();
    });
});
