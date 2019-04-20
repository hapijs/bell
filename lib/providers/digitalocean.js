'use strict';

const internals = {};


exports = module.exports = function () {

    const digitalOceanUrl = 'https://cloud.digitalocean.com/v1/oauth';
    const digitalOceanUserUrl = 'https://api.digitalocean.com/v2/account';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: digitalOceanUrl + '/authorize',
        token: digitalOceanUrl + '/token',
        profile: async function (credentials, params, get) {

            const profile = await get(digitalOceanUserUrl);
            const account = profile.account;

            credentials.profile = {
                id: account.uuid,
                email: account.email,
                status: account.status,
                dropletLimit: account.droplet_limit,
                raw: account
            };
        }
    };
};
