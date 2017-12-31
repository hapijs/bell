

// Load modules

const Bell = require('../../');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();


describe('digitalocean', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.digitalocean();
        Hoek.merge(custom, provider);

        const data = {
            account: {
                uuid: '1234',
                email: 'stevesmith@test.com',
                status: 'active',
                droplet_limit: 3
            }
        };

        Mock.override('https://api.digitalocean.com/v2/account', data);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'digitalocean',
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
            secret: 'secret',
            query: {},
            profile: {

                id: data.account.uuid,
                email: data.account.email,
                status: data.account.status,
                dropletLimit: data.account.droplet_limit,
                raw: data.account
            }
        });

        await mock.stop();
    });

    it('authenticates with mock when user has no email set', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.digitalocean();
        Hoek.merge(custom, provider);

        const data = {
            account: {
                uuid: '1234',
                status: 'active',
                dropletLimit: 3
            }
        };

        Mock.override('https://api.digitalocean.com/v2/account', data);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'digitalocean',
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
            secret: 'secret',
            query: {},
            profile: {

                id: data.account.uuid,
                email: undefined,
                status: data.account.status,
                dropletLimit: data.account.droplet_limit,
                raw: data.account
            }
        });

        await mock.stop();
    });
});
