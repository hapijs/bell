// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });

    await server.register(Bell);

    server.auth.strategy('discord', 'bell', {
        provider: 'discord',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // Fill in your clientId and clientSecret: https://discordapp.com/developers/applications/me
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'discord',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
