'use strict';

// Load modules

const { Server } = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');


const server = Server({ port: 8000 });

await server.register(Bell);

Hoek.assert(!err, err);
server.auth.strategy('arcgisonline', 'bell', {
    provider: 'arcgisonline',
    password: 'cookie_encryption_password_secure',
    isSecure: false,
    // You'll need to go to https://developers.arcgis.com/en/applications and set up an application to get started
    // Once you create your app you will get your ClientID and Client Secret.
    // Also be sure to set redirect URL as well at the bottom of the screen in Redirect URIs section.
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
        auth: 'arcgisonline',
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
