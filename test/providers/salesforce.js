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


describe('salesforce', () => {

    it('fails with extendedProfile false and identityServiceProfile true', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const throws = () => {

                    Bell.providers.salesforce({ extendedProfile: false, identityServiceProfile: true });
                };

                expect(throws).to.throw(Error);

                mock.stop(done);
            });
        });
    });

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.salesforce();

                expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
                expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

                Hoek.merge(custom, provider);

                const profile = {
                    user_id: '1234567890',
                    username: 'steve',
                    display_name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('https://login.salesforce.com/services/oauth2/userinfo', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'salesforce',
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
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile
                            });
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock and custom uri', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.salesforce({ identityServiceProfile: true });

                expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
                expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

                Hoek.merge(custom, provider);

                const profile = {
                    user_id: '1234567890',
                    username: 'steve',
                    display_name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('https://login.salesforce.com/id/foo/bar', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'salesforce',
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
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile
                            });
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock and identityServiceProfile', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.salesforce({ uri: 'http://example.com' });

                expect(custom.auth).to.equal('http://example.com/services/oauth2/authorize');
                expect(custom.token).to.equal('http://example.com/services/oauth2/token');

                Hoek.merge(custom, provider);

                const profile = {
                    user_id: '1234567890',
                    username: 'steve',
                    display_name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('http://example.com/services/oauth2/userinfo', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'salesforce',
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
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile
                            });
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock (without extended profile)', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.salesforce({ extendedProfile: false });

                expect(custom.auth).to.equal('https://login.salesforce.com/services/oauth2/authorize');
                expect(custom.token).to.equal('https://login.salesforce.com/services/oauth2/token');

                Hoek.merge(custom, provider);

                const profile = {
                    user_id: '1234567890',
                    username: 'steve',
                    display_name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('https://login.salesforce.com/services/oauth2/userinfo', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'salesforce',
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
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {}
                            });
                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });
});
