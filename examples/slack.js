// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });

    await server.register(Bell);

    server.auth.strategy('slack', 'bell', {
        provider: 'slack',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: ''
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'slack',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
