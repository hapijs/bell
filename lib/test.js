const Joi = require('joi');

clientSecretSchema = {
    protocol: Joi.string(),
    secret: Joi.alternatives().when('protocol', {
        is: 'oauth',
        then: Joi.string().required().allow(''),
        otherwise: Joi.alternatives().try(Joi.string().allow(''), Joi.object())
    }).required()
};

Joi.assert({ protocol: 'oauth2', secret: { a: 12 } }, clientSecretSchema); // Pass

Joi.assert({ protocol: 'oauth', secret: 'a' }, clientSecretSchema); // Pass
Joi.assert({ protocol: 'oauth', secret: '' } , clientSecretSchema); // Pass

Joi.assert({ protocol: 'oauth2', secret: 'a' }, clientSecretSchema); // Pass
Joi.assert({ protocol: 'oauth2', secret: '' }, clientSecretSchema); // Pass

Joi.assert({ protocol: 'oauth2' }, clientSecretSchema); // Fail

Joi.assert({ protocol: 'oauth', secret: 12 }, clientSecretSchema); // Fail
Joi.assert({ protocol: 'oauth2', secret: 12 }, clientSecretSchema); // Fail
Joi.assert({ protocol: 'oauth', secret: { a: '12' } }, clientSecretSchema); // Fail
