'use strict';

const internals = {};

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://open.weixin.qq.com/connect/qrconnect',
        token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
        scope: ['snsapi_login'],
        profile: async function (credentials, params, get) {

            const query = {
                access_token: params.access_token,
                openid: params.openid
            }

            const profile = await get('https://api.weixin.qq.com/sns/userinfo', query);

            credentials.profile = profile;
        }
    };
};
