'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ host: 'localhost', port: 8000 });
    await server.register(Bell);

    // You'll need to go to https://console.developers.google.com and set up an application to get started
    // Once you create your app, fill out "APIs & auth >> Consent screen" and make sure to set the email field
    // Next, go to "APIs & auth >> Credentials and Create new Client ID
    // Select "web application" and set "AUTHORIZED JAVASCRIPT ORIGINS" and "AUTHORIZED REDIRECT URIS"
    // This will net you the clientId and the clientSecret needed.
    // Also be sure to pass the location as well. It must be in the list of "AUTHORIZED REDIRECT URIS"
    // You must also enable the Google+ API in your profile.
    // Go to APIs & Auth, then APIs and under Social APIs click Google+ API and enable it.

    server.auth.strategy('google', 'bell', {
        provider: 'google',
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
                strategy: 'google',
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
