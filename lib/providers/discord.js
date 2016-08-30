'use strict';

exports = module.exports = function () {

    return {
        protocol: 'oauth2',
        auth: 'https://discordapp.com/api/oauth2/authorize',
        token: 'https://discordapp.com/api/oauth2/token',
        scope: ['email', 'identify'], // see https://discordapp.com/developers/docs/topics/oauth2#scopes
        profile: function (credentials, params, get, callback) {

            get('https://discordapp.com/api/users/@me', null, (profile) => {

                credentials.profile = {
                    id: profile.id,
                    discriminator: profile.discriminator,
                    username: profile.username,
                    email: profile.email,
                    mfa_enabled: profile.mfa_enabled,
                    verified: profile.verified,
                    avatar: {
                        id: profile.avatar,
                        url: 'https://discordapp.com/api/users/' + profile.id + '/avatars/' + profile.avatar + '.jpg'
                    },
                    raw: profile
                };

                return callback();
            });
        }
    };
};
