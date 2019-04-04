'use strict';

const Bell = require('../');
const Hapi = require('hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    /*
    * You can pass in your own scope rules which admins rules
    * get defaulted to identify.
    *
    */

    server.auth.strategy('slack', 'bell', {
        provider: 'slack',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: ''
        /*
        * isSameSite property
        * Fixes: https://stackoverflow.com/questions/39748688/hapi-js-bell-auth-cookie-redirect-loop
        isSameSite: 'Lax',
        * You can pass in your own scope rules. You may find it's needed for admin
        * rules which get defaulted to identify.
        scope: [
            'identify',
            'groups:read',
            'channels:read',
            'im:read',
            'mpim:read',
            'users:read',
            'users:read.email',
            'users.profile:read'
        ]
        */
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
