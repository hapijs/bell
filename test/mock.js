'use strict';

const Querystring = require('querystring');

const Boom = require('@hapi/boom');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hawk = require('@hapi/hawk');
const Teamwork = require('@hapi/teamwork');
const Wreck = require('@hapi/wreck');


const internals = {
    wreck: null
};


const expect = Code.expect;


exports.CLIENT_ID_TESTER = internals.CLIENT_ID_TESTER = 'clientIdTester';

exports.CLIENT_SECRET_TESTER = internals.CLIENT_SECRET_TESTER = 'clientSecretTester';


exports.v1 = async function (flags, options = {}) {

    const mock = {
        options,
        tokens: {},
        server: Hapi.server({ host: 'localhost' })
    };

    mock.options.signatureMethod = mock.options.signatureMethod || 'HMAC-SHA1';

    mock.server.route([
        {
            method: 'POST',
            path: '/temporary',
            options: {
                handler: function (request, h) {

                    if (mock.options.failTemporary) {
                        throw Boom.badRequest();
                    }

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_signature_method', 'oauth_callback', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    expect(header.oauth_callback).to.exist();

                    const token = String(Object.keys(mock.tokens).length + 1);
                    mock.tokens[token] = {
                        authorized: false,
                        secret: 'secret',
                        callback: header.oauth_callback
                    };

                    const payload = {
                        oauth_token: token,
                        oauth_token_secret: 'secret',
                        oauth_callback_confirmed: true
                    };

                    return h.response(Querystring.encode(payload)).type('application/x-www-form-urlencoded');
                }
            }
        },
        {
            method: 'GET',
            path: '/auth',
            options: {
                handler: function (request, h) {

                    const token = mock.tokens[request.query.oauth_token];
                    expect(token).to.exist();

                    token.authorized = true;
                    token.verifier = '123';

                    const extra = Object.keys(request.query).length > 1 ? '&extra=true' : '';
                    return h.redirect(unescape(token.callback) + '?oauth_token=' + request.query.oauth_token + '&oauth_verifier=' + token.verifier + extra);
                }
            }
        },
        {
            method: 'POST',
            path: '/token',
            options: {
                handler: function (request, h) {

                    if (mock.options.failToken) {
                        throw Boom.badRequest();
                    }

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    const token = mock.tokens[header.oauth_token];
                    expect(token).to.exist();
                    expect(token.verifier).to.equal(header.oauth_verifier);
                    expect(token.authorized).to.equal(true);

                    const payload = {
                        oauth_token: 'final',
                        oauth_token_secret: 'secret'
                    };

                    if (header.oauth_consumer_key === 'twitter') {
                        payload.user_id = '1234567890';
                        payload.screen_name = 'Steve Stevens';
                    }

                    return h.response(Querystring.encode(payload)).type('application/x-www-form-urlencoded');
                }
            }
        },
        {
            method: '*',
            path: '/resource',
            options: {
                handler: function (request, h) {

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    expect(header.oauth_token).to.equal('final');

                    return request.payload ? request.payload : 'some text reply';
                }
            }
        }
    ]);

    await mock.server.start();
    mock.uri = mock.server.info.uri;

    mock.provider = {
        protocol: 'oauth',
        temporary: mock.server.info.uri + '/temporary',
        auth: mock.server.info.uri + '/auth',
        token: mock.server.info.uri + '/token',
        signatureMethod: mock.options.signatureMethod
    };

    flags.onCleanup = () => {

        exports.clear();
        return mock.server.stop();
    };

    return mock;
};


exports.v2 = async function (flags, options = {}) {

    const mock = {
        codes: {},
        useParamsAuth: (options.useParamsAuth === false ? false : true),
        server: Hapi.server({ host: 'localhost' })
    };

    mock.server.route([
        {
            method: 'GET',
            path: '/auth',
            options: {
                handler: function (request, h) {

                    const code = String(Object.keys(mock.codes).length + 1);
                    mock.codes[code] = {
                        redirect_uri: request.query.redirect_uri,
                        client_id: request.query.client_id
                    };

                    return h.redirect(request.query.redirect_uri + '?code=' + code + '&state=' + request.query.state);
                }
            }
        },
        {
            method: 'POST',
            path: '/token',
            options: {
                handler: function (request, h) {

                    const code = mock.codes[request.payload.code];
                    expect(code).to.exist();
                    expect(code.redirect_uri).to.equal(request.payload.redirect_uri);
                    if (mock.useParamsAuth) {
                        expect(code.client_id).to.equal(request.payload.client_id);
                        expect(request.headers.authorization).to.be.undefined();
                    }
                    else {
                        const basic = Buffer.from(request.headers.authorization.slice(6), 'base64').toString();
                        expect(basic).to.startWith(code.client_id);
                        expect(request.payload.client_id).to.be.undefined();
                    }

                    const payload = {
                        access_token: '456',
                        expires_in: 3600
                    };

                    if (request.payload.code_verifier) {
                        payload.code_verifier = request.payload.code_verifier;
                    }

                    if (code.client_id === 'instagram') {
                        payload.user = {
                            id: '123456789',
                            username: 'stevegraham',
                            full_name: 'Steve Graham',
                            profile_picture: 'http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg'
                        };
                    }

                    if (code.client_id === 'vk') {
                        payload.user_id = '1234567890';
                        payload.email = 'steve@example.com';
                    }

                    if (code.client_id === 'customSecret') {
                        payload.access_token = request.headers.mycustomtoken;
                    }

                    if (code.client_id === internals.CLIENT_ID_TESTER) {
                        expect(internals.CLIENT_SECRET_TESTER).to.equal(request.payload.client_secret);
                    }

                    if (code.client_id === 'salesforce') {
                        payload.id = 'https://login.salesforce.com/id/foo/bar';
                    }

                    return h.response(payload).code(options.code || 200);
                }
            }
        }
    ]);

    await mock.server.start();
    mock.uri = mock.server.info.uri;

    mock.provider = {
        protocol: 'oauth2',
        useParamsAuth: mock.useParamsAuth,
        auth: mock.server.info.uri + '/auth',
        token: mock.server.info.uri + '/token'
    };

    flags.onCleanup = () => {

        exports.clear();
        return mock.server.stop();
    };

    return mock;
};


exports.override = function (uri, payload) {

    const team = new Teamwork.Team();

    const override = function (method) {

        return async function (dest, ...args) {

            if (dest.indexOf(uri) === 0) {
                if (typeof payload === 'function') {
                    const res = await payload(dest);

                    if (res) {
                        return { res: { statusCode: 200 }, payload: JSON.stringify(res) };
                    }

                    team.attend();
                    return { res: { statusCode: 200 }, payload: '{"x":1}' };
                }

                if (payload instanceof Error) {
                    const statusCode = (payload && payload.output ? payload.output.statusCode : 400);
                    return { res: { statusCode }, payload: JSON.stringify({ message: payload.message }) };
                }

                if (payload === null) {
                    throw Boom.internal('unknown');
                }

                return { res: { statusCode: 200 }, payload: typeof payload === 'string' ? payload : JSON.stringify(payload) };
            }

            return internals.wreck[method](dest, ...args);
        };
    };

    internals.wreck = {
        get: Wreck.get.bind(Wreck),
        post: Wreck.post.bind(Wreck)
    };

    Wreck.get = override('get');
    Wreck.post = override('post');

    return team.work;
};


exports.clear = function () {

    if (internals.wreck) {
        Wreck.get = internals.wreck.get;
        Wreck.post = internals.wreck.post;
        internals.wreck = null;
    }
};
