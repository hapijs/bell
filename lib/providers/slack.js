'use strict';

const uri = 'https://slack.com';

exports = module.exports = function slackProvider(options) {
    // Set defaults in case options are not set
    options = options || {};
    return {
        protocol: 'oauth2',
        auth: `${uri}/oauth/authorize`,
        token: `${uri}/api/oauth.access`,
        // This is the bare minimum scope required to identify the user
        scope: ['identify'],
        profile: (credentials, params, get, callback) => {

            credentials.profile = {
                access_token: params.access_token,
                scope: params.scope
            };
            // If `extendedProfile` is set to `false`, just return immediately.
            // `access_token` on `credentials.profile` can now be used to call Slack methods.
            if (options.extendedProfile === false) {
                return callback();
            }
            // If `extendedProfile` is true, get information that identifies the user.
            // Call the `auth.test` Slack method, providing the `access_token` as `token`.
            const query = {
                token: params.access_token
            };
            return get(`${uri}/api/auth.test`, query, (profile) => {

                credentials.profile.user_id = profile.user_id; // Slack User ID
                credentials.profile.user = profile.user; // Slack User Screen Name
                credentials.profile.raw = profile; // Raw Profile
                return callback();
            });
        }
    };
};
