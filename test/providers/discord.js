'use strict';

// Load modules

const Bell = require('../../');
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('discord', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

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
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, (mockRes) => {

                        server.inject({ url: mockRes.headers.location, headers: { cookie } }, (response) => {

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

                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });
});
