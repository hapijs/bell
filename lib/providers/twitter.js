'use strict';

const Hoek = require('hoek');

exports = module.exports = function (options) {

    const defaults = {
        extendedProfile: true,
        getMethod: 'users/show'
    };
    const settings = Hoek.applyToDefaults(defaults, options || {});

    return {
        protocol: 'oauth',
        signatureMethod: 'HMAC-SHA1',
        temporary: 'https://api.twitter.com/oauth/request_token',
        auth: 'https://api.twitter.com/oauth/authenticate',
        token: 'https://api.twitter.com/oauth/access_token',
        profile: async (credentials, params, get) => {

            credentials.profile = {
                id: params.user_id,
                username: params.screen_name
            };

            if (settings.extendedProfile === false) {      // Defaults to true
                // return callback();
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
