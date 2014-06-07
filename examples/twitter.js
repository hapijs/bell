// Load modules

var Hapi = require('hapi');
var Bell = require('../');


var server = new Hapi.Server(8000);
server.pack.register(Bell, function (err) {

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: 'password',
        isSecure: false,
        clientId: '',                               // Set client id
        clientSecret: ''                            // Set client secret
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {

                reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            }
        }
    });

    server.start(function (err) {

        console.log('Server started at:', server.info.uri);
    });
});
