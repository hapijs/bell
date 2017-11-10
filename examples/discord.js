'use strict';

// Load modules

const Hapi = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = Hapi.Server({ port: 8000 });

server.register(Bell, (err) => {

    Hoek.assert(!err, err);
    server.auth.strategy('discord', 'bell', {
        provider: 'discord',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // Fill in your clientId and clientSecret: https://discordapp.com/developers/applications/me
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'discord',
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
