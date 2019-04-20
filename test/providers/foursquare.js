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


describe('foursquare', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.foursquare();
        Hoek.merge(custom, mock.provider);

        const data = {
            response: {
                user: {
                    id: '1234',
                    firstName: 'Steve',
                    lastName: 'Smith',
                    gender: 'male',
                    relationship: 'self',
                    photo: {
                        prefix: 'https://irs0.4sqi.net/img/user/',
                        suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                    },
                    contact: {
                        email: 'stevesmith@test.com'
                    }
                }
            }
        };

        Mock.override('https://api.foursquare.com/v2/users/self', data);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'foursquare',
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

                id: '1234',
                displayName: 'Steve Smith',
                name: {
                    first: 'Steve',
                    last: 'Smith'
                },
                email: data.response.user.contact.email,
                raw: data.response.user
            }
        });
    });

    it('authenticates with mock when user has no email set', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.foursquare();
        Hoek.merge(custom, mock.provider);

        const data = {
            response: {
                user: {
                    id: '1234',
                    firstName: 'Steve',
                    lastName: 'Smith',
                    gender: 'male',
                    relationship: 'self',
                    photo: {
                        prefix: 'https://irs0.4sqi.net/img/user/',
                        suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                    },
                    contact: {
                        facebook: 'http://facebook.com/stevesmith.test'
                    }
                }
            }
        };

        Mock.override('https://api.foursquare.com/v2/users/self', data);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'foursquare',
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

                id: '1234',
                displayName: 'Steve Smith',
                name: {
                    first: 'Steve',
                    last: 'Smith'
                },
                email: undefined,
                raw: data.response.user
            }
        });
    });
});
