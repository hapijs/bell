'use strict';

// Load modules
const Joi = require('joi');
const Hoek = require('hoek');
const Crypto = require('crypto');

// Declare internals
//const internals = {
//    schema: Joi.object({
//        tenantId: Joi.string().guid().required()
//    }).required()
//};

exports = module.exports = function (options) {

    const results = Joi.validate(options/*, internals.schema*/);
    
    Hoek.assert(!results.error, results.error);
    
    const settings = results.value;
    
    const tenantId = settings.tenantId;
    
    return {
        name: 'microsoftonline',
        protocol: 'oauth2',
        useParamsAuth: true,
        auth:  ('https://login.microsoftonline.com/{tenantId}/oauth2/authorize').replace('{tenantId}', tenantId),
        token: ('https://login.microsoftonline.com/{tenantId}/oauth2/token').replace('{tenantId}', tenantId),
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
            
            const me = ('https://graph.windows.net/{tenantId}/me').replace('{tenantId}', tenantId);
            
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
