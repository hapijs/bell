'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    // You will need github account for setting up an application and get a clientID and ClientSecret
    // This is a helpful tutorial for the whole process: https://developer.github.com/apps/building-github-apps/creating-a-github-app/
    // This guide will help you set up your app and generate ID and secret.

    server.auth.strategy('github', 'bell', {
        provider: 'github',
        password: 'cookie_encryption_password_secure',
        isSecure: false,                                    // For testing or in environments secured via other means
        clientId: '',
        clientSecret: '',
        location: 'https://example.com',
        scope: []
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/login',
        options: {
            auth: {
                strategy: 'github',
                mode: 'try'
            },
            handler: function (request, h) {

                if (!request.auth.isAuthenticated) {
                    return `Authentication failed due to: ${request.auth.error.message}`;
                }

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
