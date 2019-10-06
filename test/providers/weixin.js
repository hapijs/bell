'use strict';

const Bell = require('../..');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const Mock = require('../mock');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('weixin', () => {

    it('authenticates with mock', async (flags) => {

        const mock = await Mock.v2(flags);
        const server = Hapi.server({ host: 'localhost', port: 80 });
        await server.register(Bell);

        const custom = Bell.providers.weixin();
        Hoek.merge(custom, mock.provider);

        const profile = {
            openid: 'o96DVwVQ2VbKjgZMpnr30ogB_h8Q',
            nickname: '张国栋',
            sex: 1,
            language: 'zh_CN',
            city: 'Weifang',
            province: 'Shandong',
            country: 'CN',
            headimgurl: 'http://thirdwx.qlogo.cn/mmopen/vi_32/5cFyA1ZQGBCxOhFvUAudqOa481NkPIHVDdf7rLZOjIWJHPiabDbKia3CIyTmkThCWFeqAKBNrYOhT9ufM45Pw/132',
            privilege: [],
            unionid: 'ou9a2v-kyFAt_3CZApMy0tWtv3BE'
        };

        Mock.override('https://api.weixin.qq.com/sns/userinfo', profile);

        // https://open.weixin.qq.com/connect/qrconnect?appid=weixin&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2Flogin&state=7FRA7Pmis15gRaCjfLc761&scope=snsapi_login
        // const  = {}
        // Mock.override('https://open.weixin.qq.com/connect/qrconnect', profile);

        server.auth.strategy('custom', 'bell', {
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            clientId: 'weixin',
            clientSecret: 'secret',
            // provider: custom
            provider: 'weixin'
        });

        server.route({
            method: '*',
            path: '/login',
            config: {
                auth: 'custom',
                handler: function (request, h) {

                    return request.auth.credentials;
                }
            }
        });

        const res1 = await server.inject('/login');

        const cookie = res1.headers['set-cookie'][0].split(';')[0] + ';';
        // const res2 = await mock.server.inject(res1.headers.location);
        const state = res1.headers.location.match(/state=(\S*)&scope/)[1];
        const location = 'http://localhost/login?code=1&state=' + state;

        const res3 = await server.inject({ url: location, headers: { cookie } });
        expect(res3.statusCode).to.equal(200);
        // expect(res3.result).to.equal({
        //     provider: 'custom',
        //     token: '456',
        //     expiresIn: 3600,
        //     refreshToken: undefined,
        //     query: {},
        //     profile
        // });
    });
});
