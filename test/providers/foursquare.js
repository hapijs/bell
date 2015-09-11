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


describe('foursquare', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.foursquare();
                Hoek.merge(custom, provider);

                var data = {
                    response: {
                        user: {
                            id: '1234',
                            firstName: 'Steve',
                            lastName: 'Smith',
                            gender: 'male',
                            relationship: 'self',
                            photo: {
                                prefix: 'https://irs0.4sqi.net/img/user/',
                                suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                            },
                            contact: {
                                email: 'stevesmith@test.com'
                            }
                        }
                    }
                };

                Mock.override('https://api.foursquare.com/v2/users/self', data);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'foursquare',
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
                                secret: 'secret',
                                query: {},
                                profile: {

                                    id: '1234',
                                    displayName: 'Steve Smith',
                                    name: {
                                        first: 'Steve',
                                        last: 'Smith'
                                    },
                                    email: data.response.user.contact.email,
                                    raw: data.response.user
                                }
                            });

                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });

    it('authenticates with mock when user has no email set', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.foursquare();
                Hoek.merge(custom, provider);

                var data = {
                    response: {
                        user: {
                            id: '1234',
                            firstName: 'Steve',
                            lastName: 'Smith',
                            gender: 'male',
                            relationship: 'self',
                            photo: {
                                prefix: 'https://irs0.4sqi.net/img/user/',
                                suffix: '/1234-K0KG0PLWAG1WTOXM.jpg'
                            },
                            contact: {
                                facebook: 'http://facebook.com/stevesmith.test'
                            }
                        }
                    }
                };

                Mock.override('https://api.foursquare.com/v2/users/self', data);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'foursquare',
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
                                secret: 'secret',
                                query: {},
                                profile: {

                                    id: '1234',
                                    displayName: 'Steve Smith',
                                    name: {
                                        first: 'Steve',
                                        last: 'Smith'
                                    },
                                    email: undefined,
                                    raw: data.response.user
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
