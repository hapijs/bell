'use strict';

// Load modules

const Bell = require('../../');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();


describe('foursquare', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.foursquare();
        Hoek.merge(custom, provider);

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

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            secret: 'secret',
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

        await mock.stop();
    });

    it('authenticates with mock when user has no email set', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.foursquare();
        Hoek.merge(custom, provider);

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

        const res = await server.inject('/login');

        const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
        const mockRes = await mock.server.inject(res.headers.location);

        const response = await server.inject({ url: mockRes.headers.location, headers: { cookie } });

        Mock.clear();
        expect(response.result).to.equal({
            provider: 'custom',
            token: '456',
            expiresIn: 3600,
            secret: 'secret',
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

        await mock.stop();
    });
});
