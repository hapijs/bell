// Load modules

var Hapi = require('hapi');
var Bell = require('../');
var server = new Hapi.Server();

server.connection({ port: 8000 });

server.register(Bell, function (err) {

    server.auth.strategy('nest', 'bell', {
        provider: 'nest',
        password: 'password',
        isSecure: false,
        // Fill in your clientId and clientSecret
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'nest',
            handler: function (request, reply) {

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            }
        }
    });

    server.start(function (err) {

        console.log('Server started at:', server.info.uri);
    });
});
