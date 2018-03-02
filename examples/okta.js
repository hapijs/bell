'use strict';

// Load modules

const Bell = require('../');
const Boom = require('boom');
const Hapi = require('hapi');


// Declare internals

const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register([require('hapi-auth-cookie'), Bell]);

    server.auth.strategy('session', 'cookie', {
        password: 'secret_cookie_encryption_password',      // Use something more secure in production
        redirectTo: '/auth/okta',                           // If there is no session, redirect here
        isSecure: false                                     // Should be set to true (which is the default) in production
    });

    server.auth.strategy('okta', 'bell', {
        provider: 'okta',
        config: { uri: 'https://your-organization.okta.com' },
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        location: 'http://127.0.0.1:8000',
        clientId: 'IIA1yMR7IK4XGhfyfCno',
        clientSecret: 'PEh_HemJovaR-Zjs-unX8-cC9IhQgzF5M1RUrUgW'
    });

    server.route({
        method: 'GET',
        path: '/auth/okta',
        options: {
            auth: 'okta',
            handler: function (request, h) {

                if (!request.auth.isAuthenticated) {
                    throw Boom.unauthorized('Authentication failed: ' + request.auth.error.message);
                }

                // Just store the third party credentials in the session as an example. You could do something
                // more useful here - like loading or setting up an account (social signup).

                request.auth.session.set(request.auth.credentials);
                return h.redirect('/');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: 'session',
            handler: function (request, h) {

                //Return a message using the information from the session

                return 'Hello, ' + request.auth.credentials.profile.email + '!';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
