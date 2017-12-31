

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
        profile: async (credentials, params, get) => {

            credentials.profile = {
                access_token: params.access_token,
                scope: params.scope
            };
            // If `extendedProfile` is set to `false`, just return immediately.
            // `access_token` on `credentials.profile` can now be used to call Slack methods.
            if (options.extendedProfile === false) {
                return;
            }
            // If `extendedProfile` is true, get information that identifies the user.
            // Call the `auth.test` Slack method, providing the `access_token` as `token`.
            const query = {
                token: params.access_token
            };
            const profile = await get(`${uri}/api/auth.test`, query);

            credentials.profile.user_id = profile.user_id; // Slack User ID
            credentials.profile.user = profile.user; // Slack User Screen Name
            credentials.profile.raw = profile; // Raw Profile
        }
    };
};
