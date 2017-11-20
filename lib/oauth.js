'use strict';

// Load modules

const Querystring = require('querystring');
const Url = require('url');
const Boom = require('boom');
const Cryptiles = require('cryptiles');
const Crypto = require('crypto');
const Hoek = require('hoek');
const Wreck = require('wreck');


// Declare internals

const internals = {
    nonceLength: 22
};


exports.v1 = function (settings) {

    const client = new internals.Client(settings);

    return async function (request, h) {

        const cookie = settings.cookie;
        const name = settings.name;
        const query = request.query;
        const protocol = internals.getProtocol(request, settings);

        // Bail if the upstream service returns an error

        if (query.error === 'access_denied' ||
            query.denied) {

            return Boom.internal('Application rejected');
        }

        // If not https but cookie is secure, throw error

        if (protocol !== 'https' && settings.isSecure) {
            return Boom.internal('Invalid setting  - isSecure must be set to false for non-https server');
        }

        // Sign-in Initialization

        if (!request.query.oauth_token) {

            // Obtain temporary OAuth credentials

            const oauth_callback = internals.location(request, protocol, settings.location);
            const payload = await client.temporary(oauth_callback);

            const state = {
                token: payload.oauth_token,
                secret: payload.oauth_token_secret,
                query: request.query
            };

            h.state(cookie, state);

            const authQuery = internals.resolveProviderParams(request, settings.providerParams);
            authQuery.oauth_token = payload.oauth_token;

            if (settings.allowRuntimeProviderParams) {
                Hoek.merge(authQuery, request.query);
            }

            return h.redirect(`${settings.provider.auth}?${internals.queryString(authQuery)}`);
        }

        // Authorization callback

        if (!request.query.oauth_verifier) {
            return Boom.internal('Missing verifier parameter in ' + name + ' authorization response');
        }

        const state = request.state[cookie];
        if (!state) {
            return internals.refreshRedirect(request, name, protocol, settings, h);
        }

        h.unstate(cookie);

        if (request.query.oauth_token !== state.token) {
            return Boom.internal(`${name} authorized request token mismatch`);
        }

        // Obtain token OAuth credentials

        const payload = await client.token(state.token, request.query.oauth_verifier, state.secret);

        const credentials = {
            provider: name,
            token: payload.oauth_token,
            secret: payload.oauth_token_secret,
            query: state.query
        };

        if (!settings.provider.profile || settings.skipProfile) {
            return h.continue({ credentials });
        }

        // Obtain user profile

        const get = async function (uri, params) {

            if (settings.profileParams) {
                Hoek.merge(params, settings.profileParams);
            }

            return await client.resource('get', uri, params, { token: payload.oauth_token, secret: payload.oauth_token_secret });
        };

        await settings.provider.profile.call(settings, credentials, payload, get);
        return h.continue({ credentials });
    };
};


exports.v2 = function (settings) {

    return async function (request, h) {

        const cookie = settings.cookie;
        const name = settings.name;
        const protocol = internals.getProtocol(request, settings);
        let query;
        let state;

        // Bail if the upstream service returns an error
        if (request.query.error === 'access_denied' || request.query.denied) {
            return Boom.internal(`App rejected: ${request.query.error_description || request.query.denied || 'No information provided'}`);
        }

        // If not https but cookie is secure, throw error
        if (protocol !== 'https' && settings.isSecure) {
            return Boom.internal('Invalid setting  - isSecure must be set to false for non-https server');
        }

        // Sign-in Initialization

        if (!request.query.code) {
            const nonce = Cryptiles.randomString(internals.nonceLength);
            query = internals.resolveProviderParams(request, settings.providerParams);

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

            state = {
                nonce,
                query: request.query
            };

            h.state(cookie, state);
            return h.redirect(`${settings.provider.auth}?${internals.queryString(query)}`);
        }

        // Authorization callback

        state = request.state[cookie];
        if (!state) {
            return internals.refreshRedirect(request, name, protocol, settings);
        }

        h.unstate(cookie);

        const requestState = request.query.state || '';
        if (state.nonce !== requestState.substr(0, Math.min(requestState.length, internals.nonceLength))) {
            return Boom.internal('Incorrect ' + name + ' state parameter');
        }

        query = {
            grant_type: 'authorization_code',
            code: request.query.code,
            redirect_uri: internals.location(request, protocol, settings.location)
        };

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
            requestOptions.headers.Authorization = 'Basic ' + (new Buffer(settings.clientId + ':' + settings.clientSecret, 'utf8')).toString('base64');
        }

        if (settings.provider.headers) {
            Hoek.merge(requestOptions.headers, settings.provider.headers);
        }

        if (typeof settings.clientSecret === 'object') {
            Hoek.merge(requestOptions, settings.clientSecret);
        }

        // Obtain token

        let payload = null;
        try {
            const { tokenRes, tokenPayload } = await Wreck.post(settings.provider.token, requestOptions);

            if (tokenRes.statusCode < 200 || tokenRes.statusCode > 299) {
                return Boom.internal(`Failed obtaining ${name} access token`, { payload, statusCode: tokenRes.statusCode });
            }

            payload = internals.parse(tokenPayload);
            if (payload instanceof Error) {
                return Boom.internal(`Received invalid payload from ${name} access token endpoint`, payload);
            }
        }
        catch (err) {
            return Boom.internal(`Failed obtaining ${name} access token`, err);
        }

        const credentials = {
            provider: name,
            token: payload.access_token,
            refreshToken: payload.refresh_token,
            expiresIn: payload.expires_in,
            query: state.query
        };

        if (!settings.provider.profile || settings.skipProfile) {
            return h.continue({ credentials, artifacts: payload });
        }

        // Obtain user profile

        const get = async function (uri, params) {

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

            const getQuery = (params ? '?' + internals.queryString(params) : '');

            try {
                const { profileRes, profilePayload } = await Wreck[settings.provider.profileMethod](uri + getQuery, getOptions);
                if (profileRes.statusCode !== 200) {
                    throw Boom.internal(`Failed obtaining ${name} user profile`, { payload: profilePayload, statusCode: profileRes.statusCOde });
                }

                profilePayload = internals.parse(profilePayload);
                if (profilePayload instanceof Error) {
                    throw Boom.internal(`Received invalid payload from ${name} user profile`, profilePayload);
                }

                return profilePayload;
            }
            catch (err) {
                throw Boom.internal(`Failed obtaining ${name} user profile`, err);
            }
        };

        await settings.provider.profile.call(settings, credentials, payload, get);
        return h.continue({ credentials, artifacts: payload });
    };
};


internals.refreshRedirect = function (request, name, protocol, settings) {

    // Workaround for some browsers where due to CORS and the redirection method, the state
    // cookie is not included with the request unless the request comes directly from the same origin.

    if (request.query.refresh) {
        throw Boom.internal('Missing ' + name + ' request token cookie');
    }
    const refreshQuery = Object.assign({}, request.url.query, { refresh: 1 });
    const refreshUrl = internals.location(request, protocol, settings.location) + '?' + internals.queryString(refreshQuery);
    return `<html><head><meta http-equiv="refresh" content="0;URL='${refreshUrl}'"></head><body></body></html>`;
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


internals.Client.prototype.temporary = async function (oauth_callback) {

    // Temporary Credentials (2.1)

    const oauth = {
        oauth_callback
    };

    return await this._request('post', this.settings.temporary, null, oauth, { desc: 'temporary credentials' });
};


internals.Client.prototype.token = async function (oauthToken, oauthVerifier, tokenSecret) {

    // Token Credentials (2.3)

    const oauth = {
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier
    };

    return await this._request('post', this.settings.token, null, oauth, { secret: tokenSecret, desc: 'token credentials' });
};


internals.Client.prototype.resource = async function (method, uri, params, options) {

    // Making Requests (3.1)

    const oauth = {
        oauth_token: options.token
    };

    return await this._request(method, uri, params, oauth, options);
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

        if (res.statusCode !== 200) {
            throw Boom.internal('Failed obtaining ' + this.provider + ' ' + desc, { payload, statusCode: res.statusCode });
        }

        let parsedPayload = payload;
        if (!options.raw) {
            parsedPayload = internals.parse(payload);
            if (payload instanceof Error) {
                throw Boom.internal('Received invalid payload from ' + this.provider + ' ' + desc + ' endpoint', { payload });
            }
        }

        return { payload: parsedPayload, statusCode: res.statusCode };
    }
    catch (err) {
        if (err.isBoom) {
            throw err;
        }

        throw Boom.internal(`Failed obtaining ${this.provider} ${desc}`, err);
    }
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
            return err;
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

internals.getProtocol = (request, settings) => {

    if (settings.forceHttps) {
        return 'https';
    }
    const location = internals.location(request, request.server.info.protocol, settings.location);
    if (location.indexOf('https:') !== -1) {
        return 'https';
    }
    return request.server.info.protocol;
};

internals.resolveProviderParams = (request, params) => {

    const obj = typeof params === 'function' ? params(request) : params;
    return obj ? Hoek.clone(obj) : {};
};
