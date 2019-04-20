'use strict';

const internals = {};


exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://secure.meetup.com/oauth2/authorize',
        token: 'https://secure.meetup.com/oauth2/access',
        scope: ['basic'],
        headers: {
            'User-Agent': 'hapi-bell-meetup'
        },
        profile: async function (credentials, params, get) {

            const profile = await get('https://api.meetup.com/2/member/self');
            credentials.profile = profile;
        }
    };
};
