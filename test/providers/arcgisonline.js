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


describe('arcgisonline', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.arcgisonline();
                Hoek.merge(custom, provider);

                var profile = {
                    orgId: 'acme',
                    username: 'disco_steve',
                    fullName: 'steve smith',
                    firstName: 'steve',
                    lastName: 'smith',
                    email: 'steve@example.com',
                    role: 'terminator'
                };

                Mock.override('https://www.arcgis.com/sharing/rest/community/self', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'arcgisonline',
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
                                    provider: 'arcgisonline',
                                    orgId: 'acme',
                                    username: 'disco_steve',
                                    displayName: 'steve smith',
                                    name: {
                                        first: 'steve',
                                        last: 'smith'
                                    },
                                    email: 'steve@example.com',
                                    role: 'terminator',
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
