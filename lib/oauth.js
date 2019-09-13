'use strict';

const Crypto = require('crypto');
const Querystring = require('querystring');
const Url = require('url');

const Boom = require('@hapi/boom');
const Bounce = require('@hapi/bounce');
const Cryptiles = require('@hapi/cryptiles');
const Hoek = require('@hapi/hoek');
const Wreck = require('@hapi/wreck');


const internals = {
    nonceLength: 22,
    codeVerifierLength: 128
};


exports.v1 = function (settings) {

    const client = new internals.Client(settings);

    return async function (request, h) {

        const cookie = settings.cookie;
        const name = settings.name;
        const protocol = internals.getProtocol(request, settings);

        // Prepare credentials

        const credentials = {
            provider: name
        };

        // Bail if the upstream service returns an error

        if (request.query.error === 'access_denied' ||
            request.query.denied) {

            return h.unauthenticated(Boom.internal('Application rejected'), { credentials });
        }

        // Error if not https but cookie is secure

        if (protocol !== 'https' &&
            settings.isSecure) {

            return h.unauthenticated(Boom.internal('Invalid setting  - isSecure must be set to false for non-https server'), { credentials });
        }

        // Sign-in Initialization

        if (!request.query.oauth_token) {
            credentials.query = request.query;

            // Obtain temporary OAuth credentials

            const oauth_callback = internals.location(request, protocol, settings.location);
            try {
                var { payload: temp } = await client.temporary(oauth_callback);
            }
            catch (err) {
                return h.unauthenticated(err, { credentials });
            }

            const state = {
                token: temp.oauth_token,
                secret: temp.oauth_token_secret,
                query: request.query
            };

            h.state(cookie, state);

            const authQuery = internals.resolveProviderParams(request, settings.providerParams);
            authQuery.oauth_token = temp.oauth_token;

            if (settings.allowRuntimeProviderParams) {
                Hoek.merge(authQuery, request.query);
            }

            return h.redirect(settings.provider.auth + '?' + internals.queryString(authQuery)).takeover();
        }

        // Authorization callback

        if (!request.query.oauth_verifier) {
            return h.unauthenticated(Boom.internal('Missing verifier parameter in ' + name + ' authorization response'), { credentials });
        }

        const state = request.state[cookie];
        if (!state) {
            return internals.refreshRedirect(request, name, protocol, settings, credentials, h);
        }

        credentials.query = state.query;
        h.unstate(cookie);

        if (request.query.oauth_token !== state.token) {
            return h.unauthenticated(Boom.internal(name + ' authorized request token mismatch'), { credentials });
        }

        // Obtain token OAuth credentials

        try {
            var { payload: token } = await client.token(state.token, request.query.oauth_verifier, state.secret);
        }
        catch (err) {
            return h.unauthenticated(err, { credentials });
        }

        credentials.token = token.oauth_token;
        credentials.secret = token.oauth_token_secret;

        if (!settings.provider.profile ||
            settings.skipProfile) {

            return h.authenticated({ credentials });
        }

        // Obtain user profile

        const get = async (uri, params = {}) => {

            if (settings.profileParams) {
                Hoek.merge(params, settings.profileParams);
            }

            const { payload: resource } = await client.resource('get', uri, params, { token: token.oauth_token, secret: token.oauth_token_secret });
            return resource;
        };

        try {
            await settings.provider.profile.call(settings, credentials, token, get);
        }
        catch (err) {
            return h.unauthenticated(err, { credentials });
        }

        return h.authenticated({ credentials });
    };
};


exports.v2 = function (settings) {

    return async function (request, h) {

        const cookie = settings.cookie;
        const name = settings.name;
        const protocol = internals.getProtocol(request, settings);

        // Prepare credentials

        const credentials = {
            provider: name
        };

        // Bail if the upstream service returns an error

        if (request.query.error === 'access_denied' ||
            request.query.denied) {

            return h.unauthenticated(Boom.internal(`App rejected: ${request.query.error_description || request.query.denied || 'No information provided'}`), { credentials });
        }

        // Error if not https but cookie is secure

        if (protocol !== 'https' &&
            settings.isSecure) {

            return h.unauthenticated(Boom.internal('Invalid setting  - isSecure must be set to false for non-https server'), { credentials });
        }

        // Sign-in Initialization

        if (!request.query.code) {
            credentials.query = request.query;

            const nonce = Cryptiles.randomString(internals.nonceLength);
            const query = internals.resolveProviderParams(request, settings.providerParams);

            if (settings.allowRuntimeProviderParams) {
                Hoek.merge(query, request.query);
            }

            query.client_id = settings.clientId;
            query.response_type = 'code';
            query.redirect_uri = internals.location(request, protocol, settings.location);
            query.state = nonce;

            if (settings.runtimeStateCallback) {
                const runtimeState = settings.runtimeStateCallback(request);
                if (runtimeState) {
                    query.state += runtimeState;
                }
            }

            let scope = settings.scope || settings.provider.scope;
            if (typeof scope === 'function') {
                scope = scope(request);
            }

            if (scope) {
                query.scope = scope.join(settings.provider.scopeSeparator || ' ');
            }

            const state = {
                nonce,
                query: request.query
            };


            if (settings.provider.pkce) {
                state.codeVerifier = internals.createCodeVerifier();
                if (settings.provider.pkce === 'S256') {

                    // S256

                    query.code_challenge = internals.createCodeChallenge(state.codeVerifier);
                    query.code_challenge_method = 'S256';
                }
                else {

                    // plain

                    query.code_challenge = state.codeVerifier;
                    query.code_challenge_method = 'plain';
                }
            }

            h.state(cookie, state);
            return h.redirect(settings.provider.auth + '?' + internals.queryString(query)).takeover();
        }

        // Authorization callback

        const state = request.state[cookie];
        if (!state) {
            return internals.refreshRedirect(request, name, protocol, settings, credentials, h);
        }

        credentials.query = state.query;
        h.unstate(cookie);

        const requestState = request.query.state || '';
        if (state.nonce !== requestState.substr(0, Math.min(requestState.length, internals.nonceLength))) {
            return h.unauthenticated(Boom.internal('Incorrect ' + name + ' state parameter'), { credentials });
        }

        const query = {
            grant_type: 'authorization_code',
            code: request.query.code,
            redirect_uri: internals.location(request, protocol, settings.location)
        };

        if (settings.provider.pkce) {
            query.code_verifier = state.codeVerifier;
        }

        if (settings.provider.useParamsAuth) {
            query.client_id = settings.clientId;
            if (typeof settings.clientSecret === 'string') {
                query.client_secret = settings.clientSecret;
            }
        }

        const requestOptions = {
            payload: internals.queryString(query),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        if (!settings.provider.useParamsAuth) {
            requestOptions.headers.Authorization = 'Basic ' + (Buffer.from(settings.clientId + ':' + settings.clientSecret, 'utf8')).toString('base64');
        }

        if (settings.provider.headers) {
            Hoek.merge(requestOptions.headers, settings.provider.headers);
        }

        if (typeof settings.clientSecret === 'object') {
            Hoek.merge(requestOptions, settings.clientSecret);
        }

        // Obtain token

        try {
            var { res: tokenRes, payload } = await Wreck.post(settings.provider.token, requestOptions);
        }
        catch (err) {
            return h.unauthenticated(Boom.internal('Failed obtaining ' + name + ' access token', err), { credentials });
        }

        if (tokenRes.statusCode < 200 ||
            tokenRes.statusCode > 299) {

            return h.unauthenticated(Boom.internal('Failed obtaining ' + name + ' access token', payload), { credentials });
        }

        try {
            payload = internals.parse(payload);
        }
        catch (err) {
            Bounce.rethrow(err, 'system');
            return h.unauthenticated(Boom.internal('Received invalid payload from ' + name + ' access token endpoint', payload), { credentials });
        }

        credentials.token = payload.access_token;
        credentials.refreshToken = payload.refresh_token;
        credentials.expiresIn = payload.expires_in;

        if (!settings.provider.profile || settings.skipProfile) {
            return h.authenticated({ credentials, artifacts: payload });
        }

        // Obtain user profile

        const get = async (uri, params = {}) => {

            const getOptions = {
                headers: {
                    Authorization: 'Bearer ' + payload.access_token
                }
            };

            if (settings.profileParams) {
                Hoek.merge(params, settings.profileParams);
            }

            if (settings.provider.headers) {
                Hoek.merge(getOptions.headers, settings.provider.headers);
            }

            const getQuery = (Object.keys(params).length ? '?' + internals.queryString(params) : '');
            try {
                var { res, payload: response } = await Wreck[settings.provider.profileMethod](uri + getQuery, getOptions);
            }
            catch (err) {
                throw Boom.internal('Failed obtaining ' + name + ' user profile', err);
            }

            if (res.statusCode !== 200) {
                throw Boom.internal('Failed obtaining ' + name + ' user profile', response);
            }

            try {
                response = internals.parse(response);
            }
            catch (err) {
                Bounce.rethrow(err, 'system');
                throw Boom.internal('Received invalid payload from ' + name + ' user profile', response);
            }

            return response;
        };

        try {
            await settings.provider.profile.call(settings, credentials, payload, get);
        }
        catch (err) {
            return h.unauthenticated(err, { credentials });
        }

        return h.authenticated({ credentials, artifacts: payload });
    };
};


internals.refreshRedirect = function (request, name, protocol, settings, credentials, h) {

    // Workaround for some browsers where due to CORS and the redirection method, the state
    // cookie is not included with the request unless the request comes directly from the same origin.

    if (request.query.refresh) {
        return h.unauthenticated(Boom.internal('Missing ' + name + ' request token cookie'), { credentials });
    }

    const refreshQuery = Object.assign({}, request.query, { refresh: 1 });
    const refreshUrl = internals.location(request, protocol, settings.location) + '?' + internals.queryString(refreshQuery);
    return h.response(`<html><head><meta http-equiv="refresh" content="0;URL='${refreshUrl}'"></head><body></body></html>`).takeover();
};


exports.Client = internals.Client = function (options) {

    this.provider = options.name;
    this.settings = {
        temporary: internals.Client.baseUri(options.provider.temporary),
        token: internals.Client.baseUri(options.provider.token),
        clientId: options.clientId,
        clientSecret: options.provider.signatureMethod === 'RSA-SHA1' ? options.clientSecret : internals.encode(options.clientSecret || '') + '&',
        signatureMethod: options.provider.signatureMethod
    };
};


internals.Client.prototype.temporary = function (oauth_callback) {

    // Temporary Credentials (2.1)

    const oauth = {
        oauth_callback
    };

    return this._request('post', this.settings.temporary, null, oauth, { desc: 'temporary credentials' });
};


internals.Client.prototype.token = function (oauthToken, oauthVerifier, tokenSecret) {

    // Token Credentials (2.3)

    const oauth = {
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier
    };

    return this._request('post', this.settings.token, null, oauth, { secret: tokenSecret, desc: 'token credentials' });
};


internals.Client.prototype.resource = function (method, uri, params, options) {

    // Making Requests (3.1)

    const oauth = {
        oauth_token: options.token
    };

    return this._request(method, uri, params, oauth, options);
};


internals.Client.prototype._request = async function (method, uri, params, oauth, options) {

    method = method.toLowerCase();

    // Prepare generic OAuth parameters

    oauth.oauth_nonce = Cryptiles.randomString(internals.nonceLength);
    oauth.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    oauth.oauth_consumer_key = this.settings.clientId;
    oauth.oauth_signature_method = this.settings.signatureMethod;
    oauth.oauth_signature = this.signature(method, uri, params, oauth, options.secret);

    // Calculate OAuth header

    const requestOptions = {
        headers: {
            Authorization: internals.Client.header(oauth)
        }
    };

    if (params) {
        const paramsString = internals.queryString(params);
        if (method === 'get') {
            uri += '?' + paramsString;
        }
        else {
            requestOptions.payload = paramsString;
            requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
    }

    if (options.stream) {
        return Wreck.request(method, uri, requestOptions);
    }

    const desc = (options.desc || 'resource');
    try {
        const { res, payload } = await Wreck[method](uri, requestOptions);
        var result = { payload: payload.toString(), statusCode: res.statusCode };
    }
    catch (err) {
        throw Boom.internal(`Failed obtaining ${this.provider} ${desc}`, err);
    }

    if (result.statusCode !== 200) {
        throw Object.assign(Boom.internal(`Failed obtaining ${this.provider} ${desc}`, result.payload), result);
    }

    if (!options.raw) {
        try {
            result.payload = internals.parse(result.payload);
        }
        catch (err) {
            Bounce.rethrow(err, 'system');
            throw Object.assign(Boom.internal(`Received invalid payload from ${this.provider} ${desc} endpoint`, result.payload), result);
        }
    }

    return result;
};


internals.Client.header = function (oauth) {

    // Authorization Header (3.5.1)

    let header = 'OAuth ';
    const names = Object.keys(oauth);
    for (let i = 0; i < names.length; ++i) {
        const name = names[i];
        header += (i ? ', ' : '') + name + '="' + internals.encode(oauth[name]) + '"';
    }

    return header;
};


internals.Client.baseUri = function (uri) {

    // Base String URI (3.4.1.2)

    const resource = Url.parse(uri, true);

    const protocol = resource.protocol.toLowerCase();
    const isDefaultPort = resource.port && ((protocol === 'http:' && resource.port === '80') || (protocol === 'https:' && resource.port === '443'));
    return protocol + '//' + resource.hostname.toLowerCase() + (isDefaultPort || !resource.port ? '' : ':' + resource.port) + resource.pathname;
};


internals.Client.prototype.signature = function (method, baseUri, params, oauth, tokenSecret) {

    // Parameters Normalization (3.4.1.3.2)

    const normalized = [];
    const normalize = function (source) {

        const names = Object.keys(source);
        for (let i = 0; i < names.length; ++i) {
            const name = names[i];
            const value = source[name];

            const encodedName = internals.encode(name);
            if (Array.isArray(value)) {
                for (let j = 0; j < value.length; ++j) {
                    normalized.push([encodedName, internals.encode(value[j])]);
                }
            }
            else {
                normalized.push([encodedName, internals.encode(value)]);
            }
        }
    };

    if (params) {
        normalize(params);
    }

    normalize(oauth);

    normalized.sort((a, b) => {

        return (a[0] < b[0] ? -1
            : (a[0] > b[0] ? 1
                : (a[1] < b[1] ? -1
                    : (a[1] > b[1] ? 1 : 0))));
    });

    let normalizedParam = '';
    for (let i = 0; i < normalized.length; ++i) {
        normalizedParam += (i ? '&' : '') + normalized[i][0] + '=' + normalized[i][1];
    }

    // String Construction (3.4.1.1)

    const baseString = internals.encode(method.toUpperCase()) + '&' +
        internals.encode(baseUri) + '&' +
        internals.encode(normalizedParam);

    if (oauth.oauth_signature_method === 'RSA-SHA1') { // RSA-SHA1 (3.4.3)
        return Crypto.createSign('sha1').update(baseString).sign(this.settings.clientSecret, 'base64');
    }

    // HMAC-SHA1 (3.4.2)

    const key = tokenSecret ? (this.settings.clientSecret + internals.encode(tokenSecret)) : this.settings.clientSecret;
    return Crypto.createHmac('sha1', key).update(baseString).digest('base64');
};


internals.encodeLookup = function () {

    const lookup = {};
    for (let i = 0; i < 128; ++i) {
        if ((i >= 48 && i <= 57) ||     // 09
            (i >= 65 && i <= 90) ||     // AZ
            (i >= 97 && i <= 122) ||    // az
            i === 45 ||                 // -
            i === 95 ||                 // _
            i === 46 ||                 // .
            i === 126) {                // ~
            lookup[i] = String.fromCharCode(i);
        }
        else {
            lookup[i] = '%' + i.toString(16).toUpperCase();
        }
    }

    return lookup;
}();


internals.encode = function (string) {

    if (!string) {
        return '';
    }

    // Percent Encoding (3.6)

    let encoded = '';
    for (let i = 0; i < string.length; ++i) {
        encoded += internals.encodeLookup[string.charCodeAt(i)];
    }

    return encoded;
};


internals.parse = function (payload) {

    payload = Buffer.isBuffer(payload) ? payload.toString() : payload;
    if (payload.trim()[0] === '{') {
        try {
            return JSON.parse(payload);
        }
        catch (err) {
            throw Boom.internal('Invalid JSON payload', err);       // Convert JSON errors to application errors
        }
    }

    return Querystring.parse(payload);
};


internals.location = function (request, protocol, location) {

    if (typeof location === 'function') {
        return location(request) || internals.location(request, protocol);
    }

    if (location) {
        return location + request.path;
    }

    return protocol + '://' + request.info.host + request.path;
};


// Provide own QS implementation for cross node version support

internals.encodePrimitive = function (value) {

    const type = typeof value;
    if (type === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (type === 'number') {
        return isFinite(value) ? value.toString() : '';
    }

    return internals.encode(value);
};


internals.Client.queryString = internals.queryString = function (params) {

    const keys = Object.keys(params);
    const fields = [];
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const value = params[key];
        const ks = internals.encodePrimitive(key) + '=';

        if (Array.isArray(value)) {
            for (let j = 0; j < value.length; ++j) {
                fields.push(ks + internals.encodePrimitive(value[j]));
            }
        }
        else {
            fields.push(ks + internals.encodePrimitive(value));
        }
    }

    return fields.join('&');
};


internals.createCodeChallenge = function (codeVerifier) {

    return Crypto.createHash('sha256')
        .update(codeVerifier, 'ascii')
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};


internals.createCodeVerifier = function () {

    return Cryptiles.randomString(internals.codeVerifierLength).replace(/_/g, '.').replace(/=/g, '~');
};


internals.getProtocol = function (request, settings) {

    if (settings.forceHttps) {
        return 'https';
    }

    const location = internals.location(request, request.server.info.protocol, settings.location);
    if (location.indexOf('https:') !== -1) {
        return 'https';
    }

    return request.server.info.protocol;
};


internals.resolveProviderParams = function (request, params) {

    const obj = typeof params === 'function' ? params(request) : params;
    return obj ? Hoek.clone(obj) : {};
};
