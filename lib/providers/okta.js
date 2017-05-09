'use strict';

// Load modules
const Joi = require('joi');
const Hoek = require('hoek');

// Declare internals

const internals = {
    schema: Joi.object({
        uri: Joi.string().uri().required()
    }).required()
};

exports = module.exports = function (options) {

    const results = Joi.validate(options, internals.schema);
    Hoek.assert(!results.error, results.error);
    const settings = results.value;

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: settings.uri + '/oauth2/v1/authorize',
        token: settings.uri + '/oauth2/v1/token',
        scope: ['profile', 'openid', 'email', 'offline_access'],
        profile: function (credentials, params, get, callback) {

            get(settings.uri + '/oauth2/v1/userinfo', null, (profile) => {

                credentials.profile = {
                    id: profile.sub,
                    username: profile.email,
                    displayName: profile.nickname,
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
