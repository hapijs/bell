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


describe('mixer', () => {

    it('authenticates with mock', {
        parallel: false
    }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = Server({
                host: 'localhost',
                port: 80
            });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.mixer();
                Hoek.merge(custom, provider);

                const profile = {
                    id: 930,
                    username: 'Mappa',
                    email: 'mappa@example.com'
                };

                Mock.override('https://mixer.com/api/v1/users/current', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'mixer',
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
                                profile
                            });

                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });
});
