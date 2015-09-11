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


describe('reddit', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.reddit();
                Hoek.merge(custom, provider);

                var profile = {
                    name: 'john',
                    created: 0,
                    created_utc: 0,
                    hide_from_robots: true,
                    gold_creddits: 0,
                    link_karma: 0,
                    comment_karma: 0,
                    over_18: true,
                    is_gold: false,
                    is_mod: true,
                    gold_expiration: null,
                    has_verified_email: true,
                    id: 'abcde',
                    inbox_count: 0
                };

                Mock.override('https://oauth.reddit.com/api/v1/me', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'reddit',
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
                                profile: profile
                            });

                            mock.stop(done);
                        });
                    });
                });
            });
        });
    });
});
