'use strict';

// Load modules
const Joi = require('joi');
const Hoek = require('hoek');

exports = module.exports = function (options) {

    const results = Joi.validate(options);
    Hoek.assert(!results.error, results.error);
    const settings = results.value;
    const tenantId = settings.tenantId;

    return {
        name: 'microsoftonline',
        protocol: 'oauth2',
        useParamsAuth: true,
        auth:  `https://login.microsoftonline.com/${tenantId}/oauth2/authorize`,
        token: `https://login.microsoftonline.com/${tenantId}/oauth2/token`,
        scope: ['openid'],
        scopeSeparator: ',',
        nonce: true,
        response_mode: 'query',
        response_type : 'code id_token',
        resource: 'https://graph.windows.net',
        profile: function (credentials, params, get, callback) {

            const query = {
                'api-version': '1.6'
            };

            const me = `https://graph.windows.net/${tenantId}/me`;

            get(me, query, (profile) => {

                credentials.profile = {
                    id: profile.objectId,
                    username: profile.userPrincipalName.split('@').shift(),
                    displayName: profile.displayName,
                    name: {
                        first: profile.givenName,
                        last: profile.surname
                    },
                    email: profile.mail.toLowerCase(),
                    raw: profile
                };

                return callback();
            });
        }
    };
};
