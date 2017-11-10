'use strict';

// Load modules

const Bell = require('../../');
const Code = require('code');
const { Server } = require('hapi');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('../mock');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('wordpress', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.wordpress();

                Hoek.merge(custom, provider);

                Mock.override('https://public-api.wordpress.com/rest/v1.1/me', {
                    ID: 12345678,
                    language: 'en',
                    token_scope: ['global'],
                    username: 'steve',
                    display_name: 'steve'
                });

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'wordpress',
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
                                    id: 12345678,
                                    username: 'steve',
                                    displayName: 'steve',
                                    raw: {
                                        ID: 12345678,
                                        language: 'en',
                                        token_scope: ['global'],
                                        username: 'steve',
                                        display_name: 'steve'
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
