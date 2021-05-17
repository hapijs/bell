'use strict';

const internals = {};


exports = module.exports = function () {

    return {
        protocol: 'oauth2',
        auth: 'https://discord.com/api/oauth2/authorize',
        token: 'https://discord.com/api/oauth2/token',
        scope: ['email', 'identify'],                                   // https://discord.com/developers/docs/topics/oauth2#scopes
        profile: async function (credentials, params, get) {

            const profile = await get('https://discord.com/api/users/@me');

            credentials.profile = {
                id: profile.id,
                discriminator: profile.discriminator,
                username: profile.username,
                email: profile.email,
                mfa_enabled: profile.mfa_enabled,
                verified: profile.verified,
                avatar: {
                    id: profile.avatar,
                    url: 'https://cdn.discordapp.com/avatars/' + profile.id + '/' + profile.avatar + '.png'
                },
                raw: profile
            };
        }
    };
};
