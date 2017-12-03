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


describe('wordpress', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.wordpress();

        Hoek.merge(custom, provider);

        Mock.override('https://public-api.wordpress.com/rest/v1.1/me', {
            ID: 12345678,
            language: 'en',
            token_scope: ['global'],
            username: 'steve',
            display_name: 'steve'
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'wordpress',
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
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                id: 12345678,
                username: 'steve',
                displayName: 'steve',
                raw: {
                    ID: 12345678,
                    language: 'en',
                    token_scope: ['global'],
                    username: 'steve',
                    display_name: 'steve'
                }
            }
        });

        await mock.stop();
    });
});
