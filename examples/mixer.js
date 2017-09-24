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
    server.auth.strategy('mixer', 'bell', {
        provider: 'mixer',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        /**
         * you need to register your OAuth client here: https://mixer.com/lab/oauth
         * for all scopes see https://dev.mixer.com/reference/oauth/index.html#oauth_scopes
         */
        clientId: '',
        clientSecret: ''
        // Uncomment the below line for more scopes (check Mixer API documentation), "user:details:self" scope is set as default
        // scope: ['user:details:self']
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/bell/door',
        config: {
            auth: 'mixer',
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
