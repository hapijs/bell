'use strict';

// Load modules

const Querystring = require('querystring');
const Boom = require('boom');
const { expect } = require('code');
const { Server } = require('hapi');
const Hawk = require('hawk');
const Hoek = require('hoek');
const Wreck = require('wreck');


// Declare internals

const internals = {};

exports.CLIENT_ID_TESTER = internals.CLIENT_ID_TESTER = 'clientIdTester';
exports.CLIENT_SECRET_TESTER = internals.CLIENT_SECRET_TESTER = 'clientSecretTester';

exports.V1 = internals.V1 = function (options) {

    this.options = options || {};
    this.options.signatureMethod = this.options.signatureMethod || 'HMAC-SHA1';

    this.tokens = {};

    this.server = Server({ host: 'localhost' });
    this.server.route([
        {
            method: 'POST',
            path: '/temporary',
            config: {
                bind: this,
                handler: function (request, h) {

                    if (this.options.failTemporary) {
                        return reply(Boom.badRequest());
                    }

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_signature_method', 'oauth_callback', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    expect(header.oauth_callback).to.exist();

                    const token = String(Object.keys(this.tokens).length + 1);
                    this.tokens[token] = {
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
            config: {
                bind: this,
                handler: function (request, h) {

                    const token = this.tokens[request.query.oauth_token];
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
            config: {
                bind: this,
                handler: function (request, h) {

                    if (this.options.failToken) {
                        return Boom.badRequest();
                    }

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    const token = this.tokens[header.oauth_token];
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
            config: {
                bind: this,
                handler: function (request, h) {

                    const header = Hawk.utils.parseAuthorizationHeader(request.headers.authorization.replace(/OAuth/i, 'Hawk'), ['realm', 'oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_verifier', 'oauth_signature', 'oauth_version', 'oauth_timestamp', 'oauth_nonce']);
                    expect(header.oauth_token).to.equal('final');

                    return request.payload ? request.payload : 'some text reply';
                }
            }
        }
    ]);
};


internals.V1.prototype.start = async function () {

    await this.server.start();
    this.uri = this.server.info.uri;

    return {
        protocol: 'oauth',
        temporary: this.server.info.uri + '/temporary',
        auth: this.server.info.uri + '/auth',
        token: this.server.info.uri + '/token',
        signatureMethod: this.options.signatureMethod
    };
};


internals.V1.prototype.stop = async function (callback) {

    await this.server.stop();
};


exports.V2 = internals.V2 = function (options) {

    options = options || {};

    this.codes = {};

    this.useParamsAuth = (options.useParamsAuth === false ? false : true);
    this.server = Server({ host: 'localhost' });
    this.server.route([
        {
            method: 'GET',
            path: '/auth',
            config: {
                bind: this,
                handler: function (request, h) {

                    const code = String(Object.keys(this.codes).length + 1);
                    this.codes[code] = {
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
            config: {
                bind: this,
                handler: function (request, h) {

                    const code = this.codes[request.payload.code];
                    expect(code).to.exist();
                    expect(code.redirect_uri).to.equal(request.payload.redirect_uri);
                    if (this.useParamsAuth) {
                        expect(code.client_id).to.equal(request.payload.client_id);
                        expect(request.headers.authorization).to.be.undefined();
                    }
                    else {
                        const basic = new Buffer(request.headers.authorization.slice(6), 'base64').toString();
                        expect(basic).to.startWith(code.client_id);
                        expect(request.payload.client_id).to.be.undefined();
                    }

                    const payload = {
                        access_token: '456',
                        expires_in: 3600
                    };

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
};


internals.V2.prototype.start = async function () {

    await this.server.start();
    this.uri = this.server.info.uri;

    return {
        protocol: 'oauth2',
        useParamsAuth: this.useParamsAuth,
        auth: this.server.info.uri + '/auth',
        token: this.server.info.uri + '/token'
    };
};


internals.V2.prototype.stop = async function () {

    await this.server.stop();
};


exports.override = function (uri, payload) {

    const override = function (method) {

        return function (dest) {

            const callback = arguments.length === 3 ? arguments[2] : arguments[1];

            if (dest.indexOf(uri) === 0) {
                if (typeof payload === 'function') {
                    return payload(dest);
                }

                if (payload instanceof Error) {
                    const statusCode = (payload && payload.output ? payload.output.statusCode : 400);
                    return Hoek.nextTick(callback)(null, { statusCode }, JSON.stringify({ message: payload.message }));
                }

                if (payload === null) {
                    return Hoek.nextTick(callback)(Boom.internal('unknown'));
                }

                return Hoek.nextTick(callback)(null, { statusCode: 200 }, typeof payload === 'string' ? payload : JSON.stringify(payload));
            }

            return internals.wreck[method].apply(null, arguments);
        };
    };

    internals.wreck = {
        get: Wreck.get.bind(Wreck),
        post: Wreck.post.bind(Wreck)
    };

    Wreck.get = override('get');
    Wreck.post = override('post');
};


exports.clear = (uri) => {

    Wreck.get = internals.wreck.get;
    Wreck.post = internals.wreck.post;
};
