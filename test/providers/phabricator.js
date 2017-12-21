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


describe('phabricator', () => {

    it('fails with no uri', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        expect(Bell.providers.phabricator).to.throw(Error);

        await mock.stop();
    });

    it('authenticates with mock and custom uri', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.phabricator({ uri: 'http://example.com' });
        Hoek.merge(custom, provider);

        const profile = {
            result: {
                phid: '1234567890',
                userName: 'steve',
                realName: 'steve',
                primaryEmail: 'steve@example.com'
            }
        };

        Mock.override('http://example.com/api/user.whoami', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'phabricator',
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
                email: 'steve@example.com',
                raw: profile
            }
        });

        await mock.stop();
    });
});
