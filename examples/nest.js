'use strict';

// Load modules

const Hapi = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = new Hapi.Server();
server.connection({ port: 8000 });

server.register(Bell, (err) => {

    Hoek.assert(!err, err);
    server.auth.strategy('nest', 'bell', {
        provider: 'nest',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // Fill in your clientId and clientSecret
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'nest',
            handler: function (request, reply) {

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            }
        }
    });

    server.start((err) => {

        Hoek.assert(!err, err);
        console.log('Server started at:', server.info.uri);
    });
});
