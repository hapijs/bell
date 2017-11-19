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


describe('arcgisonline', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.arcgisonline();
                Hoek.merge(custom, provider);

                const profile = {
                    orgId: 'acme',
                    username: 'disco_steve',
                    fullName: 'steve smith',
                    firstName: 'steve',
                    lastName: 'smith',
                    email: 'steve@example.com',
                    role: 'terminator'
                };

                Mock.override('https://www.arcgis.com/sharing/rest/community/self', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'arcgisonline',
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
                                    provider: 'arcgisonline',
                                    orgId: 'acme',
                                    username: 'disco_steve',
                                    displayName: 'steve smith',
                                    name: {
                                        first: 'steve',
                                        last: 'smith'
                                    },
                                    email: 'steve@example.com',
                                    role: 'terminator',
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
