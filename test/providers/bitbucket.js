// Load modules

var Bell = require('../../');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Lab = require('lab');
var Mock = require('../mock');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('bitbucket', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.bitbucket();
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

                server.inject('/login', function (res) {

                    var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, function (mockRes) {

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, function (response) {

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

    it('authenticates with mock (last_name is empty)', { parallel: false }, function (done) {

        var mock = new Mock.V1();
        mock.start(function (provider) {


            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.bitbucket();
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

                server.inject('/login', function (res) {

                    var cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, function (mockRes) {

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, function (response) {

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
