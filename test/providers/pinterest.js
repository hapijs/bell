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


describe('pinterest', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const pinterest = Bell.providers.pinterest();
        Hoek.merge(pinterest, mock.provider);

        const profile = {
            data: {
                id: '1234567890',
                username: 'steve',
                first_name: 'steve',
                last_name: 'smith'
            }
        };

        Mock.override('https://api.pinterest.com/v1/me/', profile);

        server.auth.strategy('pinterest', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'pinterest',
            clientSecret: 'secret',
            provider: pinterest
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'pinterest',
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
            provider: 'pinterest',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                username: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith'
                },
                raw: profile
            }
        });
    });
});
