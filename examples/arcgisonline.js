// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });

    await server.register(Bell);

    server.auth.strategy('arcgisonline', 'bell', {
        provider: 'arcgisonline',
        password: 'cookie_encryption_password_secure',
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
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
})();
