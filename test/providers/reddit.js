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


describe('reddit', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.reddit();
        Hoek.merge(custom, provider);

        const profile = {
            name: 'john',
            created: 0,
            created_utc: 0,
            hide_from_robots: true,
            gold_creddits: 0,
            link_karma: 0,
            comment_karma: 0,
            over_18: true,
            is_gold: false,
            is_mod: true,
            gold_expiration: null,
            has_verified_email: true,
            id: 'abcde',
            inbox_count: 0
        };

        Mock.override('https://oauth.reddit.com/api/v1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'reddit',
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
