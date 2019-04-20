'use strict';

const Hoek = require('@hapi/hoek');


const internals = {
    defaults: {
        extendedProfile: true,
        getMethod: 'users/show'
    }
};


exports = module.exports = function (options) {

    const settings = Hoek.applyToDefaults(internals.defaults, options || {});

    return {
        protocol: 'oauth',
        signatureMethod: 'HMAC-SHA1',
        temporary: 'https://api.twitter.com/oauth/request_token',
        auth: 'https://api.twitter.com/oauth/authenticate',
        token: 'https://api.twitter.com/oauth/access_token',
        profile: async function (credentials, params, get) {

            credentials.profile = {
                id: params.user_id,
                username: params.screen_name
            };

            if (settings.extendedProfile === false) {      // Defaults to true
                return;
            }

            const paramDefaults = {
                user_id: params.user_id
            };

            const getParams = Hoek.applyToDefaults(paramDefaults, settings.getParams || {});

            const profile = await get(`https://api.twitter.com/1.1/${settings.getMethod}.json`, getParams);
            credentials.profile.displayName = profile.name;
            credentials.profile.raw = profile;
        }
    };
};
