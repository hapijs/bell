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


describe('facebook', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook();
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com',
            picture: {
                data: {
                    is_silhouette: false,
                    url: 'https://example.com/profile.png'
                }
            }
        };

        Mock.override('https://graph.facebook.com/v3.1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'facebook',
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
                id: '1234567890',
                username: 'steve',
                displayName: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith',
                    middle: undefined
                },
                email: 'steve@example.com',
                picture: {
                    data: {
                        is_silhouette: false,
                        url: 'https://example.com/profile.png'
                    }
                },
                raw: profile
            }
        });
    });

    it('authenticates with mock (with custom fields)', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook({ fields: 'id,name,email,first_name,last_name,middle_name,picture' });
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com',
            picture: {
                data: {
                    is_silhouette: false,
                    url: 'https://example.com/profile.png'
                }
            }
        };

        Mock.override('https://graph.facebook.com/v3.1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'facebook',
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
                id: '1234567890',
                username: 'steve',
                displayName: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith',
                    middle: undefined
                },
                email: 'steve@example.com',
                picture: {
                    data: {
                        is_silhouette: false,
                        url: 'https://example.com/profile.png'
                    }
                },
                raw: profile
            }
        });
    });

    it('authenticates with mock (with custom scope)', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.facebook({ scope: ['email', 'user-birthday'] });
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: '1234567890',
            username: 'steve',
            name: 'steve',
            first_name: 'steve',
            last_name: 'smith',
            email: 'steve@example.com',
            picture: {
                data: {
                    is_silhouette: false,
                    url: 'https://example.com/profile.png'
                }
            }
        };

        Mock.override('https://graph.facebook.com/v3.1/me', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'facebook',
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
        expect(res2.request.query.scope).to.be.equals('email,user-birthday');

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
        expect(res3.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                username: 'steve',
                displayName: 'steve',
                name: {
                    first: 'steve',
                    last: 'smith',
                    middle: undefined
                },
                email: 'steve@example.com',
                picture: {
                    data: {
                        is_silhouette: false,
                        url: 'https://example.com/profile.png'
                    }
                },
                raw: profile
            }
        });
    });

});
