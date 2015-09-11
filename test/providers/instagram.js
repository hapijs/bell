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


describe('instagram', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.instagram();
                Hoek.merge(custom, provider);

                var profile = {
                    meta: { code: 200 },
                    data: { property: 'something' }
                };

                Mock.override('https://api.instagram.com/v1/users/self', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'instagram',
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
                                token: '456',
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile: {
                                    id: '123456789',
                                    username: 'stevegraham',
                                    displayName: 'Steve Graham',
                                    raw: {
                                        property: 'something'
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

    it('authenticates with mock (without extended profile)', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.instagram({ extendedProfile: false });
                Hoek.merge(custom, provider);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'instagram',
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

                            expect(response.result).to.deep.equal({
                                provider: 'custom',
                                token: '456',
                                expiresIn: 3600,
                                refreshToken: undefined,
                                query: {},
                                profile: {
                                    id: '123456789',
                                    username: 'stevegraham',
                                    displayName: 'Steve Graham',
                                    raw: {
                                        id: '123456789',
                                        username: 'stevegraham',
                                        full_name: 'Steve Graham',
                                        profile_picture: 'http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg'
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
