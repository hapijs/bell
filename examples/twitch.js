'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    // You need to register developer application with a Twitch account to obtain your clientId, clientSecret, and assign redirect URI

    server.auth.strategy('twitch', 'bell', {
        provider: 'twitch',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',                                   // Set client id
        clientSecret: ''                                // Set client secret
        // scope: ['user_read', 'channel_read']         // Uncomment for more scopes (check Twitch API documentation), "user_read" scope is set as default
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/bell/door',
        options: {
            auth: {
                strategy: 'twitch',
                mode: 'try'
            },
            handler: function (request, h) {

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
