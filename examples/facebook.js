'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ host: 'localhost', port: 8000 });
    await server.register(Bell);

    // You'll need to go to https://developers.facebook.com/ and set up a
    // Website application to get started
    // Once you create your app, fill out Settings and set the App Domains
    // Under Settings >> Advanced, set the Valid OAuth redirect URIs to include http://<yourdomain.com>/bell/door
    // and enable Client OAuth Login

    server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: '',
        location: server.info.uri
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: {
                strategy: 'facebook',
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
