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


describe('linkedin', () => {

    it('authenticates with mock', { parallel: false }, (done) => {

        const mock = new Mock.V2();
        mock.start((provider) => {

            const server = new Hapi.Server();
            server.connection({ host: 'localhost', port: 80 });
            server.register(Bell, (err) => {

                expect(err).to.not.exist();

                const custom = Bell.providers.linkedin();
                Hoek.merge(custom, provider);

                const profile = {
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

                server.inject('/login', (res) => {

                    const cookie = res.headers['set-cookie'][0].split(';')[0] + ';';
                    mock.server.inject(res.headers.location, (mockRes) => {

                        server.inject({ url: mockRes.headers.location, headers: { cookie: cookie } }, (response) => {

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

    it('adds profile fields', { parallel: false }, (done) => {

        const custom = Bell.providers.linkedin();

        const strategyOptions = {
            clientSecret: 'secret',
            providerParams: {
                fields: '(id,firstName)'
            }
        };
        Hoek.merge(custom, strategyOptions);

        const profile = {
            id: '1234567890',
            firstName: 'steve',
            lastName: 'smith',
            headline: 'Master of the universe'
        };

        custom.profile({ token: '456' }, null, (url, query, callback) => {

            expect(url).to.equal('https://api.linkedin.com/v1/people/~(id,firstName)');
            callback(profile);
        }, () => {

            done();
        });
    });
});
