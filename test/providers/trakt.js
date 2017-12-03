'use strict';

// Load modules

const Bell = require('../../');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('trakt', () => {

    it('fails with no API key', { parallel: false }, async () => {

        const mock = new Mock.V2();
        await mock.start();

        const server = new Hapi.Server();
        server.connection({ host: 'localhost', port: 80 });
        await server.register(Bell);


        expect(Bell.providers.trakt).to.throw(Error);
        await mock.stop();
    });

    it('authenticates with mock and API key', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = new Hapi.Server();
        server.connection({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.trakt({ apiKey: 'trakt-api-key' });
        Hoek.merge(custom, provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            email: 'steve@example.com',
            state: 'active'
        };

        Mock.override('https://api.trakt.tv/users/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'trakt',
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
});
