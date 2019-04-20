'use strict';

const Bell = require('..');
const Hapi = require('@hapi/hapi');


const internals = {};


internals.start = async function () {

    const server = Hapi.server({ host: 'localhost', port: 8000 });
    await server.register(Bell);

    // You'll need an Office 365 account to set up an application and get a clientID and ClientSecret
    // This is a helpful tutorial for the whole process: https://dev.outlook.com/restapi/tutorial/node
    // Once you have an account, you can set up your app and generate an ID and Secret here:
    // https://apps.dev.microsoft.com/

    server.auth.strategy('office', 'bell', {
        provider: 'office365',
        clientId: '',
        clientSecret: '',
        providerParams: {
            response_type: 'code'
        },
        scope: ['openid', 'offline_access', 'profile']
    });

    server.route({
        method: '*',
        path: '/bell/door',
        options: {
            auth: {
                strategy: 'office',
                mode: 'try'
            },
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
};

internals.start();
