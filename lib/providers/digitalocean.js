'use strict';

exports = module.exports = function () {

    const digitalOceanUrl = 'https://cloud.digitalocean.com/v1/oauth';
    const digitalOceanUserUrl = 'https://api.digitalocean.com/v2/account';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: digitalOceanUrl + '/authorize',
        token: digitalOceanUrl + '/token',
        profile: function (credentials, params, get, callback) {

            get(digitalOceanUserUrl, null, (profile) => {

                const account = profile.account;

                credentials.profile = {
                    id: account.uuid,
                    email: account.email,
                    status: account.status,
                    dropletLimit: account.droplet_limit,
                    raw: account
                };

                return callback();
            });
        }
    };
};
