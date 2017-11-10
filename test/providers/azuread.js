'use strict';

// Load modules

const Bell = require('../../');
const { expect } = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;


// Test helpers

const testProfile = function (opts) {

    const profile = opts.profile;
    const expectedResult = opts.expectedResult;
    const done = opts.done;
    const mock = new Mock.V2();
    mock.start((provider) => {

        const server = Server({ host: 'localhost', port: 80 });
        server.register(Bell, (err) => {

            expect(err).to.not.exist();

            const custom = Bell.providers.azuread();
            Hoek.merge(custom, provider);

            Mock.override('https://login.microsoftonline.com/common/openid/userinfo', profile);

            server.auth.strategy('custom', 'bell', {
                password: 'cookie_encryption_password_secure',
                isSecure: false,
                clientId: 'azuread',
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
                        expect(response.result).to.equal(expectedResult);

                        mock.stop(done);
                    });
                });
            });
        });
    });
};

describe('azuread', () => {

    it('authenticates with mock Azure AD', { parallel: false }, (done) => {

        const profile = {
            oid: '1234567890',
            name: 'Sample AD User',
            upn: 'sample@microsoft.com'
        };
        testProfile({
            profile,
            expectedResult: {
                provider: 'custom',
                token: '456',
                expiresIn: 3600,
                refreshToken: undefined,
                query: {},
                profile: {
                    id: '1234567890',
                    displayName: 'Sample AD User',
                    email: 'sample@microsoft.com',
                    raw: profile
                }
            },
            done
        });
    });

    it('authenticates with mock Azure AD email', { parallel: false }, (done) => {

        const profile = {
            oid: '1234567890',
            name: 'Sample AD User',
            email: 'sample@microsoft.com'
        };
        testProfile({
            profile,
            expectedResult: {
                provider: 'custom',
                token: '456',
                expiresIn: 3600,
                refreshToken: undefined,
                query: {},
                profile: {
                    id: '1234567890',
                    displayName: 'Sample AD User',
                    email: 'sample@microsoft.com',
                    raw: profile
                }
            },
            done
        });
    });

    it('authenticates with mock azure AD and custom tenant', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.azuread({ tenant: 'abc-def-ghi' });
                Hoek.merge(custom, provider);

                const profile = {
                    oid: '1234567890',
                    name: 'Sample AD User',
                    upn: 'sample@microsoft.com'
                };

                Mock.override('https://login.microsoftonline.com/abc-def-ghi/openid/userinfo', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'azuread',
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
                                profile: {
                                    id: '1234567890',
                                    displayName: 'Sample AD User',
                                    email: 'sample@microsoft.com',
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
