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


describe('bitbucket', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.bitbucket();
        Hoek.merge(custom, mock.provider);

        Mock.override('https://api.bitbucket.org/2.0/user', {
            repositories: [{}],
            uuid: '1E9C5160-E436-11E5-9897-4FCB70D5A8C7',
            username: 'steve',
            display_name: 'steve'
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'bitbucket',
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
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                id: '1E9C5160-E436-11E5-9897-4FCB70D5A8C7',
                username: 'steve',
                displayName: 'steve',
                raw: {
                    repositories: [{}],
                    uuid: '1E9C5160-E436-11E5-9897-4FCB70D5A8C7',
                    username: 'steve',
                    display_name: 'steve'
                }
            }
        });
    });
});
