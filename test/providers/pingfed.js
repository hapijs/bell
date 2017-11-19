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


describe('pingfed', () => {

    it('authenticates with mock', {
        parallel: false
    }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Hapi.Server({
                host: 'localhost',
                port: 80
            });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.pingfed();
                Hoek.merge(custom, provider);

                const profile = {
                    id: 'steve.smith@example.com',
                    displayName: 'steve.smith@example.com',
                    username: 'steve.smith@example.com',
                    email: 'steve.smith@example.com',
                    sub: 'steve.smith@example.com'
                };
                // need to fix this
                Mock.override('https://login-dev.ext.hpe.com/idp/userinfo.openid', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'pingfed',
                    clientSecret: 'secret',
                    provider: custom
                });

                server.route({
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply){

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, (mockRes) => {

                        server.inject({
                            url: mockRes.headers.location,
                            headers: {
                                cookie
                            }
                        }, (response) => {

                            Mock.clear();
                            expect(response.result).to.equal({
                                provider: 'custom',
                                token: '456',
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile: {
                                    id: 'steve.smith@example.com',
                                    displayName: 'steve.smith@example.com',
                                    username: 'steve.smith@example.com',
                                    email: 'steve.smith@example.com',
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
    it('authenticates with mock and custom uri ', {
        parallel: false
    }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Hapi.Server({
                host: 'localhost',
                port: 80
            });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.pingfed({ uri: 'https://login-dev.ext.hpe.com' });
                Hoek.merge(custom, provider);

                const profile = {
                    id: 'steve.smith@example.com',
                    displayName: 'steve.smith@example.com',
                    username: 'steve.smith@example.com',
                    email: 'steve.smith@example.com',
                    sub: 'steve.smith@example.com'
                };
                // need to fix this
                Mock.override('https://login-dev.ext.hpe.com/idp/userinfo.openid', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'pingfed',
                    clientSecret: 'secret',
                    provider: custom
                });

                server.route({
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'custom',
                        handler: function (request, reply){

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, (mockRes) => {

                        server.inject({
                            url: mockRes.headers.location,
                            headers: {
                                cookie
                            }
                        }, (response) => {

                            Mock.clear();
                            expect(response.result).to.equal({
                                provider: 'custom',
                                token: '456',
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile: {
                                    id: 'steve.smith@example.com',
                                    displayName: 'steve.smith@example.com',
                                    username: 'steve.smith@example.com',
                                    email: 'steve.smith@example.com',
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
