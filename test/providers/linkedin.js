'use strict';

const Bell = require('../..');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const Mock = require('../mock');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('linkedin', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.linkedin();
        Hoek.merge(custom, mock.provider);

        const profile = {
            id: '1234567890',
            firstName: {
                localized: {
                    en_US: 'steve'
                },
                preferredLocal: {
                    country: 'US',
                    language: 'en'
                }
            },
            lastName: {
                localized: {
                    en_US: 'smith'
                },
                preferredLocal: {
                    country: 'US',
                    language: 'en'
                }
            }
        };

        const email = {
            elements: [{
                handle: 'urn:li:emailAddress:3775708763',
                'handle~': {
                    emailAddress: 'steve.smith@domain.com'
                }
            }]
        };

        Mock.override('https://api.linkedin.com/v2', (dest) => {

            if (dest.startsWith('https://api.linkedin.com/v2/me')) {
                return profile;
            }

            return email;
        });

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
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
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res1 = await server.inject('/login');
        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';

        const res2 = await mock.server.inject(res1.headers.location);

        const res3 = await server.inject({ url: res2.headers.location, headers: { cookie } });
        expect(res3.result).to.equal({
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
                raw: {
                    profile,
                    email
                }
            }
        });
    });

    it('adds profile fields', async () => {

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
            firstName: {
                localized: {
                    en_US: 'steve'
                },
                preferredLocal: {
                    country: 'US',
                    language: 'en'
                }
            },
            lastName: {
                localized: {
                    en_US: 'smith'
                },
                preferredLocal: {
                    country: 'US',
                    language: 'en'
                }
            }
        };

        const email = {
            elements: [{
                handle: 'urn:li:emailAddress:3775708763',
                'handle~': {
                    emailAddress: 'steve.smith@domain.com'
                }
            }]
        };

        let profileChecked = false;

        const get = (url, query) => {

            if (!profileChecked) {
                expect(url).to.equal('https://api.linkedin.com/v2/me?projection=(id,firstName)');
                profileChecked = true;
                return profile;
            }

            expect(url).to.equal('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))');

            return email;
        };

        await custom.profile({ token: '456' }, null, get);

        delete custom.providerParams.fields;
        profileChecked = false;

        const get2 = (url, query) => {

            if (!profileChecked) {
                expect(url).to.equal('https://api.linkedin.com/v2/me');
                profileChecked = true;
                return profile;
            }

            return email;
        };

        await custom.profile({ token: '456' }, null, get2);
    });
});
