'use strict';

// Load modules

const { Server } = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = Server({ port: 8000 });

await server.register(Bell);

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
        handler: function (request, h) {

            reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
        }
    }
});

server.start((err) => {

    Hoek.assert(!err, err);
    console.log('Server started at:', server.info.uri);
});
});
