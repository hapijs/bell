'use strict';

// Load modules

const Hapi = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = new Hapi.Server();
server.connection({
    port: 8000
});

server.register(Bell, (err) => {

    Hoek.assert(!err, err);
    server.auth.strategy('twitch', 'bell', {
        provider: 'twitch',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // You need to register developer application with a Twitch account to obtain your clientId, clientSecret, and asign redirect URI
        clientId: '', // Set client id
        clientSecret: '' // Set client secret
        // Uncomment the below line for more scopes (check Twitch API documentation), "user_read" scope is set as default
        // scope: ['user_read', 'channel_read']
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/bell/door',
        config: {
            auth: 'twitch',
            handler: function (request, reply) {

                if (!request.auth.isAuthenticated) {
                    return reply('Authentication failed due to: ' + request.auth.error.message);
                }

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');

            }
        }
    });

    server.start((err) => {

        Hoek.assert(!err, err);
        console.log('Server started at:', server.info.uri);
    });
});
