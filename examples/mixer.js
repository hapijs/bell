'use strict';

// Load modules

const Hapi = require('hapi');
const Hoek = require('hoek');
const Bell = require('../');

const server = new Hapi.Server();
server.connection({
	host: 'localhost',
	port: 4567
});

server.register(Bell, (err) => {
	Hoek.assert(!err, err);
	server.auth.strategy('mixer', 'bell', {
		provider: 'mixer',
		password: 'cookie_encryption_password_secure',
		isSecure: false,
		clientId: '',
		clientSecret: ''
	});

	server.route({
		method: '*',
		path: '/bell/door',
		config: {
			auth: 'mixer',
			handler: function (request, reply) {
				if (!request.auth.isAuthenticated) {
					return reply('Authentication failed due to: ' + request.auth.error.message);
				}
				reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
			}
		}
	});

	server.start((err) => {
		
		Hoek.assert(!err, err);
		console.log('Server started at:', server.info.uri);
	})
});