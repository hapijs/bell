// Load modules

var Hapi = require('hapi');
var Hoek = require('hoek');
var Bell = require('../');


var server = new Hapi.Server(8000, { location: 'http://localhost:8000' });
server.pack.register(Bell, function (err) {

    Hoek.assert(!err);

    server.auth.strategy('twitter', 'bell', {
        password: 'password',
        isSecure: false,
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {

                reply(request.auth.credentials);
            }
        }
    });
    server.start(function (err) {

        Hoek.assert(!err);
        console.log('Server started at:', server.info.uri);
    });
});
