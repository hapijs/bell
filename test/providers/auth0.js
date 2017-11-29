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


describe('auth0', () => {

    it('fails with no domain', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        expect(Bell.providers.auth0).to.throw(Error);

        await mock.stop();
    });

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.auth0({ domain: 'example.auth0.com' });
        Hoek.merge(custom, provider);

        const profile = {
            user_id: 'auth0|1234567890',
            name: 'steve smith',
            given_name: 'steve',
            family_name: 'smith',
            email: 'steve@example.com'
        };

        Mock.override('https://example.auth0.com/userinfo', profile);

        server.auth.strategy('custom', 'bell', {
            config: {
                domain: 'example.auth0.com'
            },
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: '123',
            clientSecret: 'secret',
            provider: custom
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    reply(request.auth);
                }
            }
        });

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result.credentials).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: 'auth0|1234567890',
                displayName: 'steve smith',
                name: {
                    first: 'steve',
                    last: 'smith'
                },
                email: 'steve@example.com',
                raw: profile
            }
        });
        expect(response.result.artifacts).to.equal({
            'access_token': '456',
            'expires_in': 3600
        });
        await mock.stop();
    });
});
