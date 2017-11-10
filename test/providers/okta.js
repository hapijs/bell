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

describe('Okta', () => {

    it('fails with no uri', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                expect(Bell.providers.okta).to.throw(Error);

                mock.stop(done);
            });
        });
    });

    it('authenticates with mock and custom uri', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.okta({ uri: 'http://example.com' });

                expect(custom.auth).to.equal('http://example.com/oauth2/v1/authorize');
                expect(custom.token).to.equal('http://example.com/oauth2/v1/token');

                Hoek.merge(custom, provider);

                const profile = {
                    sub: '1234567890',
                    nickname: 'steve_smith',
                    given_name: 'steve',
                    middle_name: 'jared',
                    family_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('http://example.com/oauth2/v1/userinfo', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'okta',
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
                                    username: 'steve@example.com',
                                    displayName: 'steve_smith',
                                    firstName: 'steve',
                                    lastName: 'smith',
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
});
