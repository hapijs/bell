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

describe('pinterest', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const pinterest = Bell.providers.pinterest();
                Hoek.merge(pinterest, provider);

                const profile = {
                    data: {
                        id: '1234567890',
                        username: 'steve',
                        first_name: 'steve',
                        last_name: 'smith'
                    }
                };

                Mock.override('https://api.pinterest.com/v1/me/', profile);

                server.auth.strategy('pinterest', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'pinterest',
                    clientSecret: 'secret',
                    provider: pinterest
                });

                server.route({
                    method: '*',
                    path: '/login',
                    config: {
                        auth: 'pinterest',
                        handler: function (request, reply) {

                            reply(request.auth.credentials);
                        }
                    }
                });

                server.inject('/login', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, (mockRes) => {

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            Mock.clear();
                            expect(response.result).to.equal({
                                provider: 'pinterest',
                                token: '456',
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile: {
                                    id: '1234567890',
                                    username: 'steve',
                                    name: {
                                        first: 'steve',
                                        last: 'smith'
                                    },
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
