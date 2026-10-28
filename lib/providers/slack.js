'use strict';

const Boom = require('@hapi/boom');


const internals = {
    uri: 'https://slack.com'
};


exports = module.exports = function slackProvider(options = {}) {

    return {
        protocol: 'oauth2',
        auth: `${internals.uri}/oauth/authorize`,
        token: `${internals.uri}/api/oauth.access`,
        scope: ['identify'],                                    // Minimum scope required to identify the user
        profile: async function (credentials, params, get) {

            credentials.profile = {
                access_token: params.access_token,
                scope: params.scope
            };

            if (options.extendedProfile === false) {
                return;
            }

            const query = {
                token: params.access_token
            };

            const profile = await get(`${internals.uri}/api/auth.test`, query);
            if (!profile.ok) {
                throw Boom.internal('Failed obtaining slack user profile', profile);    // Slack answers errors with a 200
            }

            credentials.profile.user_id = profile.user_id;  // Slack User ID
            credentials.profile.user = profile.user;        // Slack User Screen Name
            credentials.profile.raw = profile;              // Raw Profile
        }
    };
};
