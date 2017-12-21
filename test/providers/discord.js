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


describe('discord', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        const provider = await mock.start();

        const server = Server({ host: 'localhost', port: 80 });
        await server.register(Bell);



        const custom = Bell.providers.discord();
        Hoek.merge(custom, provider);

        Mock.override('https://discordapp.com/api/users/@me', {
            id: '80351110224678912',
            username: 'Nelly',
            discriminator: '1337',
            mfa_enabled: false,
            avatar: '8342729096ea3675442027381ff50dfe',
            verified: true,
            email: 'nelly@discordapp.com'
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'discord',
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
            refreshToken: undefined,
            expiresIn: 3600,
            query: {},
            profile: {
                id: '80351110224678912',
                username: 'Nelly',
                discriminator: '1337',
                mfa_enabled: false,
                avatar: {
                    id: '8342729096ea3675442027381ff50dfe',
                    url: 'https://cdn.discordapp.com/avatars/80351110224678912/8342729096ea3675442027381ff50dfe.png'
                },
                verified: true,
                email: 'nelly@discordapp.com',
                raw: {
                    id: '80351110224678912',
                    username: 'Nelly',
                    discriminator: '1337',
                    mfa_enabled: false,
                    avatar: '8342729096ea3675442027381ff50dfe',
                    verified: true,
                    email: 'nelly@discordapp.com'
                }
            }
        });

        await mock.stop();
    });
});
