// Load modules

const { Server } = require('hapi');
const Bell = require('../');

(async () => {

    const server = Server({ port: 8000 });

    await server.register(Bell);

    server.auth.strategy('meetup', 'bell', {
        provider: 'meetup',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        // Firstly give the meetup oauth docs a quick glance --> http://www.meetup.com/meetup_api/auth/#oauth2
        // Secondly you'll need to create an OAuth consumer --> https://secure.meetup.com/meetup_api/oauth_consumers/
        // Now you can fill in the required fields below and take this example for a test drive
        clientId: '',
        clientSecret: ''
        // Uncomment the below line for more scopes, if not you get the "basic" scope by default
        // scope: ['basic', 'ageless', 'group_edit', 'reporting']
    });

    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: 'meetup',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
})();
