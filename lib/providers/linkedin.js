'use strict';

// Load modules

const Crypto = require('crypto');


// Declare internals

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.linkedin.com/uas/oauth2/authorization',
        token: 'https://www.linkedin.com/uas/oauth2/accessToken',
        scope: ['r_basicprofile', 'r_emailaddress'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                format: 'json',
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };

            let fields = '';
            if (this.providerParams && this.providerParams.fields) {
                fields = this.providerParams.fields;
            }

            const profile = await get('https://api.linkedin.com/v1/people/~' + fields, query);

            credentials.profile = {
                id: profile.id,
                name: {
                    first: profile.firstName,
                    last: profile.lastName
                },
                email: profile.emailAddress,
                headline: profile.headline,
                raw: profile
            };
        }
    };
};
