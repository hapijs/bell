'use strict';

const Crypto = require('crypto');

const Hoek = require('@hapi/hoek');


const internals = {};


exports = module.exports = function (options) {

    const defaults = {
        fields: 'id,name,email,first_name,last_name,middle_name,picture,gender,link,locale,timezone,updated_time,verified',
        scope: ['email']
    };
    const settings = Hoek.applyToDefaults(defaults, options || {});

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.facebook.com/v3.1/dialog/oauth',
        token: 'https://graph.facebook.com/v3.1/oauth/access_token',
        scope: settings.scope,
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex'),
                fields: settings.fields
            };

            const profile = await get('https://graph.facebook.com/v3.1/me', query);

            credentials.profile = {
                id: profile.id,
                username: profile.username,
                displayName: profile.name,
                name: {
                    first: profile.first_name,
                    last: profile.last_name,
                    middle: profile.middle_name
                },
                email: profile.email,
                picture: profile.picture,
                raw: profile
            };
        }
    };
};
