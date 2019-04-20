'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });
    await server.register(Bell);

    // Firstly give the meetup oauth docs a quick glance --> http://www.meetup.com/meetup_api/auth/#oauth2
    // Secondly you'll need to create an OAuth consumer --> https://secure.meetup.com/meetup_api/oauth_consumers/
    // Now you can fill in the required fields below and take this example for a test drive

    server.auth.strategy('meetup', 'bell', {
        provider: 'meetup',
        password: 'cookie_encryption_password_secure',
        isSecure: false,
        clientId: '',
        clientSecret: ''
        // scope: ['basic', 'ageless', 'group_edit', 'reporting']       // Uncomment for more scopes, if not you get the "basic" scope by default
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: 'meetup',
            handler: function (request, h) {

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    });

    await server.start();
    console.log('Server started at:', server.info.uri);
};

internals.start();
