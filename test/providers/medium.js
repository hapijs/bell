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


describe('medium', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2({ code: 201 });
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.medium();
        Hoek.merge(custom, provider);

        const profile = {
            data: {
                id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                username: 'majelbstoat',
                name: 'Jamie Talbot',
                url: 'https://medium.com/@majelbstoat',
                imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
            }
        };

        Mock.override('https://api.medium.com/v1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'medium',
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
                id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                username: 'majelbstoat',
                displayName: 'Jamie Talbot',
                raw: {
                    id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                    username: 'majelbstoat',
                    name: 'Jamie Talbot',
                    url: 'https://medium.com/@majelbstoat',
                    imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
                }
            }
        });

        await mock.stop();
    });
});
