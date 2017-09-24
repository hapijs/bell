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


describe('dropbox-v2', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.dropboxV2();
                Hoek.merge(custom, provider);

                const profile = {
                    display_name: '1234567890',
                    username: 'steve',
                    name: 'steve',
                    first_name: 'steve',
                    last_name: 'smith',
                    email: 'steve@example.com'
                };

                Mock.override('https://api.dropboxapi.com/2/users/get_current_account', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'cookie_encryption_password_secure',
                    isSecure: false,
                    clientId: 'dropbox',
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
});
