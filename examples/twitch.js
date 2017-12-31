// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });
    await server.register(Bell);

    server.auth.strategy('twitch', 'bell', {
        provider: 'twitch',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // You need to register developer application with a Twitch account to obtain your clientId, clientSecret, and asign redirect URI
        clientId: '', // Set client id
        clientSecret: '' // Set client secret
        // Uncomment the below line for more scopes (check Twitch API documentation), "user_read" scope is set as default
        // scope: ['user_read', 'channel_read']
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/bell/door',
        config: {
            auth: 'twitch',
            handler: function (request, h) {

                if (!request.auth.isAuthenticated) {
                    return 'Authentication failed due to: ' + request.auth.error.message;
                }

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
