'use strict';

// Load modules

const Bell = require('../../');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');

const Mock = require('../mock');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('auth0', () => {

    it('fails with no domain', () => {

        expect(Bell.providers.auth0).to.throw(Error);
    });

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.auth0({ domain: 'example.auth0.com' });
        Hoek.merge(custom, mock.provider);

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

                    return request.auth;
                }
            }
        });

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
        expect(res3.result.credentials).to.equal({
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

        expect(res3.result.artifacts).to.equal({
            'access_token': '456',
            'expires_in': 3600
        });
    });
});
