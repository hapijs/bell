// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        auth: 'https://www.arcgis.com/sharing/rest/oauth2/authorize',
        token: 'https://www.arcgis.com/sharing/rest/oauth2/token',
        scope: [],
        profile: function (credentials, params, get, callback) {

            var query = {
                token: params.access_token,
                f: 'json'
            };

            get('https://www.arcgis.com/sharing/rest/community/self', query, function (profile) {
                credentials.profile = {
                    provider: 'arcgisonline',
                    orgId: profile.orgId,
                    username: profile.username,
                    displayName: profile.fullName,
                    name: {
                        first: profile.firstName,
                        last: profile.lastName
                    },
                    email: profile.email,
                    role: profile.role,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
