'use strict';

const Hapi = require('hapi');
const Bell = require('../');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    server.auth.strategy('github', 'bell', {
        provider: 'github',
        password: 'cookie_encryption_password_secure',
        clientId: '',
        clientSecret: '',
        location: 'https://example.com',
        scope: []
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/login',
        options: {
            auth: 'github',
            handler: function (request, h) {

                if (!request.auth.isAuthenticated) {
                    return `Authentication failed due to: ${request.auth.error.message}`;
                }

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
