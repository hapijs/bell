'use strict';

exports = module.exports = () => {

    const domain = 'connect.stripe.com';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: `https://${domain}/oauth/authorize`,
        token: `https://${domain}/oauth/token`,
        scope: ['read_only'],
        headers: { 'User-Agent': 'hapi-bell-stripe' },
        profile: function (credentials, params, get, callback) {

            const user = `https://${credentials.token}@${domain}/v1/account`;

            get(user, null, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    legalName: profile.business_name,
                    displayName: profile.display_name,
                    email: profile.email,
                    raw: profile
                };

                return callback();
            });
        }
    };
};
