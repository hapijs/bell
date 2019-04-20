'use strict';

const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');


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
    const settings = Joi.attempt(combinedSettings, internals.schema);

    return {
        protocol: 'oauth2',
        auth: settings.uri + '/services/oauth2/authorize',
        token: settings.uri + '/services/oauth2/token',
        useParamsAuth: true,
        profile: async function (credentials, params, get) {

            if (settings.extendedProfile === false) {
                return;
            }

            const profile = await get(settings.identityServiceProfile ? params.id : `${settings.uri}/services/oauth2/userinfo`);
            credentials.profile = profile;
        }
    };
};
