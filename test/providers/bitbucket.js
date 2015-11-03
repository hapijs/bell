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


describe('bitbucket', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V1();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.bitbucket();
                Hoek.merge(custom, provider);

                Mock.override('https://bitbucket.org/api/1.0/user', {
                    repositories: [{}],
                    user: {
                        first_name: 'Steve',
                        last_name: 'Stevens',
                        username: 'steve_stevens'
                    }
                });

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'bitbucket',
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

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            Mock.clear();
                            expect(response.result).to.deep.equal({
                                provider: 'custom',
                                token: 'final',
                                secret: 'secret',
                                query: {},
                                profile: {
                                    id: 'steve_stevens',
                                    username: 'steve_stevens',
                                    displayName: 'Steve Stevens',
                                    raw: {
                                        repositories: [{}],
                                        user: {
                                            first_name: 'Steve',
                                            last_name: 'Stevens',
                                            username: 'steve_stevens'
                                        }
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

    it('authenticates with mock (last_name is empty)', { parallel: false }, (done) => {

        const mock = new Mock.V1();
        mock.start((provider) => {


            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.bitbucket();
                Hoek.merge(custom, provider);

                Mock.override('https://bitbucket.org/api/1.0/user', {
                    // source: https://confluence.atlassian.com/display/BITBUCKET/user+Endpoint
                    repositories: [{}],
                    user: {
                        first_name: 'Steve',
                        last_name: '',
                        username: 'steve_stevens'
                    }
                });

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'twitter',
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

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

                            Mock.clear();
                            expect(response.result).to.deep.equal({
                                provider: 'custom',
                                token: 'final',
                                secret: 'secret',
                                query: {},
                                profile: {
                                    id: 'steve_stevens',
                                    username: 'steve_stevens',
                                    displayName: 'Steve',
                                    raw: {
                                        repositories: [{}],
                                        user: {
                                            first_name: 'Steve',
                                            last_name: '',
                                            username: 'steve_stevens'
                                        }
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
