// Load modules

var Hapi = require('hapi');
var Bell = require('../');


var server = new Hapi.Server();
server.connection({ host: 'localhost', port: 3456 });

server.register(Bell, function (err) {

    server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: 'password',
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

    server.start(function (err) {

        console.log('Server started at:', server.info.uri);
    });
});
