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


describe('yahoo', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V1();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.yahoo();
        Hoek.merge(custom, provider);

        const profile = {
            profile: {
                guid: '1234567890',
                givenName: 'steve',
                familyName: 'smith'
            }
        };

        Mock.override('https://social.yahooapis.com/v1/user/', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'yahoo',
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
                displayName: 'steve smith',
                name: {
                    first: 'steve',
                    last: 'smith'
                },
                raw: profile
            }
        });

        await mock.stop();
    });
});
