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


describe('medium', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2({ code: 201 });
        mock.start((provider) => {

            const server = Hapi.Server({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.medium();
                Hoek.merge(custom, provider);

                const profile = {
                    data: {
                        id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                        username: 'majelbstoat',
                        name: 'Jamie Talbot',
                        url: 'https://medium.com/@majelbstoat',
                        imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
                    }
                };

                Mock.override('https://api.medium.com/v1/me', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'medium',
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
                                    id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                                    username: 'majelbstoat',
                                    displayName: 'Jamie Talbot',
                                    raw: {
                                        id: '5303d74c64f66366f00cb9b2a94f3251bf5',
                                        username: 'majelbstoat',
                                        name: 'Jamie Talbot',
                                        url: 'https://medium.com/@majelbstoat',
                                        imageUrl: 'https://images.medium.com/0*fkfQiTzT7TlUGGyI.png'
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
