'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.linkedin.com/oauth/v2/authorization',
        token: 'https://www.linkedin.com/oauth/v2/accessToken',
        scope: ['r_liteprofile', 'r_emailaddress'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            let fields = '';
            if (this.providerParams && this.providerParams.fields) {
                fields = '?projection=' + this.providerParams.fields;
            }

            const profile = await get('https://api.linkedin.com/v2/me' + fields);
            const email = await get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))');

            credentials.profile = {
                id: profile.id,
                name: {
                    first: profile.firstName.localized[Object.keys(profile.firstName.localized)[0]],
                    last: profile.lastName.localized[Object.keys(profile.lastName.localized)[0]]
                },
                email: email.elements[0]['handle~'].emailAddress,
                raw: {
                    profile,
                    email
                }
            };
        }
    };
};
