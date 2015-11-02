'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://secure.meetup.com/oauth2/authorize',
        token: 'https://secure.meetup.com/oauth2/access',
        scope: ['basic'],
        headers: { 'User-Agent': 'hapi-bell-meetup' },
        profile: function (credentials, params, get, callback) {

            get('https://api.meetup.com/2/member/self', {}, (profile) => {

                credentials.profile = profile;
                return callback();
            });
        }
    };
};
