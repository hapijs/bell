'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    server.auth.strategy('nest', 'bell', {
        provider: 'nest',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',                                       // Fill in your clientId and clientSecret
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: 'nest',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
