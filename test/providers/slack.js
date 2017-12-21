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

describe('slack', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.slack();
        Hoek.merge(custom, provider);

        const profile = {
            ok: true,
            url: 'https:\/\/example.slack.com\/',
            team: 'Example',
            user: 'cal',
            team_id: 'T12345',
            user_id: 'U12345'
        };

        Mock.override('https://slack.com/api/auth.test', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
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
                access_token: '456',
                scope: undefined,
                user: 'cal',
                user_id: 'U12345',
                raw: profile
            }
        });
        await mock.stop();
    });

    it('authenticates with mock (without extended profile)', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.slack({ extendedProfile: false });
        Hoek.merge(custom, provider);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'slack',
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

        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                scope: undefined,
                access_token: '456'
            }
        });

        await mock.stop();
    });
});
