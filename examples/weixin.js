'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ host: 'localhost', port: 8000 });
    await server.register(Bell);

    // You'll need to go to https://open.weixin.qq.com/ and set up an application to get started
    // If you want to use a local server, please set 'isHttpOnly: false'

    server.auth.strategy('weixin', 'bell', {
        provider: 'weixin',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // isHttpOnly: false,
        clientId: '',
        clientSecret: '',
        // location: 'http://localhost:8000/bell/door'
    });

    server.route({
        method: '*',
        // path: '/bell/door',
        path: '/',
        options: {
            payload: {
                timeout: false
            },
            auth: {
                strategy: 'weixin',
                mode: 'try'
            },
            handler: function (request, h) {
                console.log(request)
                if (!request.auth.isAuthenticated) {
                    return 'Authentication failed due to: ' + request.auth.error.message;
                }

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
