'use strict';

const Bell = require('../..');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const Mock = require('../mock');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('office365', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.office365();
        Hoek.merge(custom, mock.provider);

        const profile = {
            Id: '1234567890',
            DisplayName: 'steve smith',
            EmailAddress: 'steve_smith@domain.onmicrosoft.com'
        };

        Mock.override('https://outlook.office.com/api/v2.0/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'office365',
            clientSecret: 'secret',
            provider: custom
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: {
                    strategy: 'custom'
                },
                handler: function (request, h) {
                    /*if (!request.auth.isAuthenticated) {
                        return reply('Authentication failed due to: '+request.auth.error.message);
                    }*/
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
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                id: '1234567890',
                displayName: 'steve smith',
                email: 'steve_smith@domain.onmicrosoft.com',
                raw: profile
            }
        });
    });
});
