

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
        auth: settings.uri + '/oauthserver/auth/',
        token: settings.uri + '/oauthserver/token/',
        scope: ['whoami'],
        scopeSeparator: ',',
        profile: async function (credentials, params, get) {

            const query = {
                access_token: credentials.token
            };

            const profile = await get(settings.uri + '/api/user.whoami', query);

            credentials.profile = {
                id: profile.result.phid,
                username: profile.result.userName,
                displayName: profile.result.realName,
                email: profile.result.primaryEmail,
                raw: profile
            };
        }
    };
};
