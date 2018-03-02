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


describe('arcgisonline', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.arcgisonline();
        Hoek.merge(custom, mock.provider);

        const profile = {
            orgId: 'acme',
            username: 'disco_steve',
            fullName: 'steve smith',
            firstName: 'steve',
            lastName: 'smith',
            email: 'steve@example.com',
            role: 'terminator'
        };

        Mock.override('https://www.arcgis.com/sharing/rest/community/self', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'arcgisonline',
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

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });

        expect(res3.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                provider: 'arcgisonline',
                orgId: 'acme',
                username: 'disco_steve',
                displayName: 'steve smith',
                name: {
                    first: 'steve',
                    last: 'smith'
                },
                email: 'steve@example.com',
                role: 'terminator',
                raw: profile
            }
        });
    });
});
