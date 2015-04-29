// Load modules

var Hapi = require('hapi');
var Bell = require('../');


var server = new Hapi.Server();
server.connection({ port: 8000 });

server.register(Bell, function (err) {

    server.auth.strategy('linkedin', 'bell', {
        provider: 'linkedin',
        password: 'password',
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
            handler: function (request, reply) {

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            }
        }
    });

    server.start(function (err) {

        console.log('Server started at:', server.info.uri);
    });
});
