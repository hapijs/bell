'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: false,
        auth: 'https://www.fitbit.com/oauth2/authorize',
        token: 'https://api.fitbit.com/oauth2/token',
        scope: ['activity', 'profile'],                                 // https://dev.fitbit.com/docs/oauth2/#scope
        profile: async function (credentials, params, get) {

            const profile = await get('https://api.fitbit.com/1/user/-/profile.json');

            credentials.profile = {
                id: profile.user.encodedId,
                displayName: profile.user.displayName,
                name: profile.user.fullName
            };
        }
    };
};
