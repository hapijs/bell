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


describe('medium', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags, { code: 201 });
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.medium();
        Hoek.merge(custom, mock.provider);

        const profile = {
            data: {
                id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                username: 'majelbstoat',
                name: 'Jamie Talbot',
                url: 'https://medium.com/@majelbstoat',
                imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
            }
        };

        Mock.override('https://api.medium.com/v1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'medium',
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
                id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                username: 'majelbstoat',
                displayName: 'Jamie Talbot',
                raw: {
                    id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                    username: 'majelbstoat',
                    name: 'Jamie Talbot',
                    url: 'https://medium.com/@majelbstoat',
                    imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
                }
            }
        });
    });
});
