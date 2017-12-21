'use strict';

// Load modules

const { Server } = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = Server({ port: 8000 });

await server.register(Bell);

Hoek.assert(!err, err);
server.auth.strategy('linkedin', 'bell', {
    provider: 'linkedin',
    password: 'cookie_encryption_password_secure',
    isSecure: false,
    // You'll need to go to https://www.linkedin.com/secure/developer?newapp= and set up an application to get started
    // Follow the instructions on https://developer.linkedin.com/docs/oauth2 to setup redirect_uri and default scopes
    clientId: '',
    clientSecret: '',
    providerParams: {
        redirect_uri: server.info.uri + '/bell/door'
    }
});

server.route({
    method: '*',
    path: '/bell/door',
    config: {
        auth: 'linkedin',
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
