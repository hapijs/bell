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

describe('pinterest', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const pinterest = Bell.providers.pinterest();
        Hoek.merge(pinterest, provider);

        const profile = {
            data: {
                id: '1234567890',
                username: 'steve',
                first_name: 'steve',
                last_name: 'smith'
            }
        };

        Mock.override('https://api.pinterest.com/v1/me/', profile);

        server.auth.strategy('pinterest', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'pinterest',
            clientSecret: 'secret',
            provider: pinterest
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'pinterest',
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
            provider: 'pinterest',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                username: 'steve',
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
