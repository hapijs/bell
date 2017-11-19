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


describe('live', () => {

    it('authenticates with mock', { parallel: false }, async () => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.live();
                Hoek.merge(custom, provider);

                const profile = {
                    id: '1234567890',
                    username: 'steve',
                    name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    emails: {
                        preferred: 'steve@example.com',
                        account: 'steve@example.net'
                    }
                };

                Mock.override('https://apis.live.net/v5.0/me', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'live',
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
                mock.server.inject(res.headers.location, (mockRes) => {

                    server.inject({ url: mockRes.headers.location, headers: { cookie } }, (response) => {

                        Mock.clear();
                        expect(response.result).to.equal({
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
                                    last: 'smith'
                                },
                                email: 'steve@example.com',
                                raw: profile
                            }
                        });

                        mock.stop(done);
                    });
                });
            });
        });
    });
});

it('authenticates with mock (no preferred email)', { parallel: false }, async () => {

    const mock = new Mock.V2();
    mock.start((provider) => {

        const server = Server({ host: 'localhost', port: 80 });
        server.register(Bell, (err) => {

            expect(err).to.not.exist();

            const custom = Bell.providers.live();
            Hoek.merge(custom, provider);

            const profile = {
                id: '1234567890',
                username: 'steve',
                name: 'steve',
                first_name: 'steve',
                last_name: 'smith',
                emails: {
                    account: 'steve@example.net'
                }
            };

            Mock.override('https://apis.live.net/v5.0/me', profile);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'live',
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
            mock.server.inject(res.headers.location, (mockRes) => {

                server.inject({ url: mockRes.headers.location, headers: { cookie } }, (response) => {

                    Mock.clear();
                    expect(response.result).to.equal({
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
                                last: 'smith'
                            },
                            email: 'steve@example.net',
                            raw: profile
                        }
                    });

                    mock.stop(done);
                });
            });
        });
    });
});
    });

it('authenticates with mock (no emails)', { parallel: false }, async () => {

    const mock = new Mock.V2();
    mock.start((provider) => {

        const server = Server({ host: 'localhost', port: 80 });
        server.register(Bell, (err) => {

            expect(err).to.not.exist();

            const custom = Bell.providers.live();
            Hoek.merge(custom, provider);

            const profile = {
                id: '1234567890',
                username: 'steve',
                name: 'steve',
                first_name: 'steve',
                last_name: 'smith'
            };

            Mock.override('https://apis.live.net/v5.0/me', profile);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'live',
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
            mock.server.inject(res.headers.location, (mockRes) => {

                server.inject({ url: mockRes.headers.location, headers: { cookie } }, (response) => {

                    Mock.clear();
                    expect(response.result).to.equal({
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
                                last: 'smith'
                            },
                            email: undefined,
                            raw: profile
                        }
                    });

                    mock.stop(done);
                });
            });
        });
    });
});
    });

it('authenticates with mock (empty email)', { parallel: false }, async () => {

    const mock = new Mock.V2();
    mock.start((provider) => {

        const server = Server({ host: 'localhost', port: 80 });
        server.register(Bell, (err) => {

            expect(err).to.not.exist();

            const custom = Bell.providers.live();
            Hoek.merge(custom, provider);

            const profile = {
                id: '1234567890',
                username: 'steve',
                name: 'steve',
                first_name: 'steve',
                last_name: 'smith',
                emails: {}
            };

            Mock.override('https://apis.live.net/v5.0/me', profile);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'live',
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
            mock.server.inject(res.headers.location, (mockRes) => {

                server.inject({ url: mockRes.headers.location, headers: { cookie } }, (response) => {

                    Mock.clear();
                    expect(response.result).to.equal({
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
                                last: 'smith'
                            },
                            email: undefined,
                            raw: profile
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
