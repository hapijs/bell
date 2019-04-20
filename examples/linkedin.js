'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    // You'll need to go to https://www.linkedin.com/secure/developer?newapp= and set up an application to get started
    // Follow the instructions on https://developer.linkedin.com/docs/oauth2 to setup redirect_uri and default scopes

    server.auth.strategy('linkedin', 'bell', {
        provider: 'linkedin',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: '',
        providerParams: {
            redirect_uri: server.info.uri + '/bell/door'
        }
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: 'linkedin',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
