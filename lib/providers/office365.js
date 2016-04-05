'use strict';

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scope: ['openid','offline_access', 'profile',//still not clear that I need all of these
                'https://outlook.office.com/mail.readwrite',
                'https://outlook.office.com/mail.send',
                'https://outlook.office.com/calendars.readwrite',
                'https://outlook.office.com/contacts.read'],
        profile: function (credentials, params, get, reply) {
            get('https://outlook.office.com/api/v2.0/me', null, function (profile) {
                
                credentials.profile = {
                    id: profile.Id,
                    displayName: profile.DisplayName,
                    email: profile.EmailAddress,
                    raw: profile
                };
                return reply();
            });
        }
    };
};
