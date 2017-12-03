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


describe('office365', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.office365();
        Hoek.merge(custom, provider);

        const profile = {
            Id: '1234567890',
            DisplayName: 'steve smith',
            EmailAddress: 'steve_smith@domain.onmicrosoft.com'
        };

        Mock.override('https://outlook.office.com/api/v2.0/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'office365',
            clientSecret: 'secret',
            provider: custom
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: {
                    strategy: 'custom'
                },
                handler: function (request, h) {
                    /*if (!request.auth.isAuthenticated) {
                        return reply('Authentication failed due to: '+request.auth.error.message);
                    }*/
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
                id: '1234567890',
                displayName: 'steve smith',
                email: 'steve_smith@domain.onmicrosoft.com',
                raw: profile
            }
        });

        await mock.stop();
    });
});
