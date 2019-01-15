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
        scope: ['r_liteprofile', 'r_emailaddress'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                format: 'json',
                appsecret_proof: Crypto.createHmac('sha256', this.clientSecret).update(credentials.token).digest('hex')
            };

            let fields = '';
            if (this.providerParams && this.providerParams.fields) {
                fields = '?projection=' + this.providerParams.fields;
            }

            const profile = await get('https://api.linkedin.com/v2/me' + fields, query);
            const email = await get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', query);

            credentials.profile = {
                id: profile.id,
                name: {
                    first: profile.firstName.localized[Object.keys(profile.firstName.localized)[0]],
                    last: profile.lastName.localized[Object.keys(profile.lastName.localized)[0]]
                },
                email: email['handle~'].emailAddress,
                raw: {
                    profile,
                    email
                }
            };
        }
    };
};
