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


describe('tumblr', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v1(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.tumblr();
        Hoek.merge(custom, mock.provider);

        const profile = {
            response: {
                user: { name: 'username' }
            }
        };

        Mock.override('https://api.tumblr.com/v2/user/info', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'tumblr',
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
            token: 'final',
            secret: 'secret',
            query: {},
            profile: {
                username: 'username',
                raw: {
                    name: 'username'
                }
            }
        });
    });
});
