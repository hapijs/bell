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


describe('linkedin', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.linkedin();
        Hoek.merge(custom, provider);

        const profile = {
            id: '1234567890',
            firstName: 'steve',
            lastName: 'smith',
            emailAddress: 'steve.smith@domain.com',
            headline: 'Master of the universe'
        };

        Mock.override('https://api.linkedin.com/v1/people/~', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'linkedin',
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
            refreshToken: undefined,
            query: {},
            profile: {
                id: '1234567890',
                name: {
                    first: 'steve',
                    last: 'smith'
                },
                email: 'steve.smith@domain.com',
                headline: 'Master of the universe',
                raw: profile
            }
        });

        await mock.stop();
    });

    it('adds profile fields', { parallel: false }, async () => {

        const custom = Bell.providers.linkedin();

        const strategyOptions = {
            clientSecret: 'secret',
            providerParams: {
                fields: '(id,firstName)'
            }
        };
        Hoek.merge(custom, strategyOptions);

        const profile = {
            id: '1234567890',
            firstName: 'steve',
            lastName: 'smith',
            headline: 'Master of the universe'
        };

        custom.profile({ token: '456' }, null, (url, query, callback) => {

            expect(url).to.equal('https://api.linkedin.com/v1/people/~(id,firstName)');
            callback(profile);
        }, () => {

            done();
        });
    });
});
