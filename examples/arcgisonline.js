// Load modules

var Hapi = require('hapi');
var Bell = require('../');


var server = new Hapi.Server();
server.connection({ port: 8000 });

server.register(Bell, function (err) {

    server.auth.strategy('arcgisonline', 'bell', {
        provider: 'arcgisonline',
        password: 'password',
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
            handler: function (request, reply) {

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            }
        }
    });

    server.start(function (err) {

        console.log('Server started at:', server.info.uri);
    });
});
