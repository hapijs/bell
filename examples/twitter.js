// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });
    await server.register(Bell);

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // Make sure to set a "Callback URL" and
        // check the "Allow this application to be used to Sign in with Twitter"
        // on the "Settings" tab in your Twitter application
        clientId: '',                               // Set client id
        clientSecret: ''                            // Set client secret
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'twitter',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
