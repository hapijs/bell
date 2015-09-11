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


describe('linkedin', function () {

    it('authenticates with mock', { parallel: false }, function (done) {

        var mock = new Mock.V2();
        mock.start(function (provider) {

            var server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, function (err) {

                expect(err).to.not.exist();

                var custom = Bell.providers.linkedin();
                Hoek.merge(custom, provider);

                var profile = {
                    id: '1234567890',
                    firstName: 'steve',
                    lastName: 'smith',
                    email: 'steve.smith@domain.com',
                    headline: 'Master of the universe'
                };

                Mock.override('https://api.linkedin.com/v1/people/~', profile);

                server.auth.strategy('custom', 'bell', {
                    password: 'password',
                    isSecure: false,
                    clientId: 'linkedin',
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
                                    id: '1234567890',
                                    name: {
                                        first: 'steve',
                                        last: 'smith'
                                    },
                                    email: 'steve.smith@domain.com',
                                    headline: 'Master of the universe',
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

    it('adds profile fields', { parallel: false }, function (done) {

        var custom = Bell.providers.linkedin();

        var strategyOptions = {
            clientSecret: 'secret',
            providerParams: {
                fields: '(id,firstName)'
            }
        };
        Hoek.merge(custom, strategyOptions);

        var profile = {
            id: '1234567890',
            firstName: 'steve',
            lastName: 'smith',
            headline: 'Master of the universe'
        };

        custom.profile({ token: '456' }, null, function (url, query, callback) {

            expect(url).to.equal('https://api.linkedin.com/v1/people/~(id,firstName)');
            callback(profile);
        }, function () {

            done();
        });
    });
});
