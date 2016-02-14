'use strict';

// Load modules

const Hapi = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = new Hapi.Server();
server.connection({ host: 'localhost', port: 3456 });

server.register(Bell, (err) => {

    Hoek.assert(!err, err);
    server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // You'll need to go to https://developers.facebook.com/ and set up a
        // Website application to get started
        // Once you create your app, fill out Settings and set the App Domains
        // Under Settings >> Advanced, set the Valid OAuth redirect URIs to include http://<yourdomain.com>/bell/door
        // and enable Client OAuth Login
        clientId: '',
        clientSecret: '',
        location: server.info.uri
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: {
                strategy: 'facebook',
                mode: 'try'
            },
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
