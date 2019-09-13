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


describe('cognito', () => {

    it('fails with no uri', () => {

        expect(Bell.providers.cognito).to.throw(Error);
    });

    it('authenticates with mock and custom uri ', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.cognito({ uri: 'http://example.com' });
        Hoek.merge(custom, mock.provider);

        const profile = {
            sub: '1111111111',
            email: 'steve.smith@example.com',
            preferred_username: 'steve.smith',
            name: 'Steve Smith',
            given_name: 'Steve',
            family_name: 'Smith'
        };

        Mock.override('http://example.com/oauth2/userInfo', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'cognito',
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
                id: '1111111111',
                username: 'steve.smith',
                email: 'steve.smith@example.com',
                displayName: 'Steve Smith',
                firstName: 'Steve',
                lastName: 'Smith',
                raw: profile
            }
        });
    });
});
