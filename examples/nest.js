// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });

    await server.register(Bell);

    server.auth.strategy('nest', 'bell', {
        provider: 'nest',
        password: 'cookie_encryption_password_secure',
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
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
