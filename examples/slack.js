'use strict';

const Bell = require('../');
const Hapi = require('hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);
    server.auth.strategy('slack', 'bell', {
        provider: 'slack',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: '',
        isSameSite: 'Lax', // fixes issue with Auth Redirect Loop
        scope: [
          'identify',
          'groups:read',
          'channels:read',
          'im:read',
          'mpim:read',
          'users:read',
          'users:read.email',
          'users.profile:read',
        ], // fixes non admin users don't get the proper scope.
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: 'slack',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
};

internals.start();
