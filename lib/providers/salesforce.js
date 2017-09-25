'use strict';

const Joi = require('joi');
const Hoek = require('hoek');

const internals = {};

internals.schema = Joi.object({
    uri: Joi.string().uri().optional(),
    extendedProfile: Joi.boolean().optional(),
    identityServiceProfile: Joi.boolean().optional().when('extendedProfile', { is: false, then: Joi.invalid(true) })
});

internals.defaults = {
    uri: 'https://login.salesforce.com',
    extendedProfile: true,
    identityServiceProfile: false
};

exports = module.exports = function (options) {

    const combinedSettings = Hoek.applyToDefaults(internals.defaults, options || {});
    const validated = Joi.validate(combinedSettings, internals.schema);
    Hoek.assert(!validated.error, validated.error);
    const settings = validated.value;

    return {
        protocol: 'oauth2',
        auth: settings.uri + '/services/oauth2/authorize',
        token: settings.uri + '/services/oauth2/token',
        useParamsAuth: true,
        profile: function (credentials, params, get, callback) {

            if (settings.extendedProfile === false) {
                return callback();
            }

            if (settings.identityServiceProfile) {
                get(params.id, null, (profile) => {

                    credentials.profile = profile;
                    return callback();
                });
            }
            else {
                get(`${settings.uri}/services/oauth2/userinfo`, null, (profile) => {

                    credentials.profile = profile;
                    return callback();
                });
            }
        }
    };
};
