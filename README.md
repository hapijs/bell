<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
##bell

**bell** is a third-party login plugin for [hapi](https://github.com/spumko/hapi). **bell** ships with built-in support for Facebook, GitHub,
Google, Twitter, Yahoo, and Windows Live. It also supports any compliant OAuth 1.0a and 2.0 based login services with a simple configuration
object.

[![Build Status](https://secure.travis-ci.org/spumko/bell.png)](http://travis-ci.org/spumko/bell)

### Example

```javascript
var Hapi = require('hapi');
var Bell = require('bell');

var server = new Hapi.Server(8000);

// Register bell with the server

server.pack.register(Bell, function (err) {

    // Declare an authentication strategy using the bell scheme
    // with the name of the provider, cookie encryption password,
    // and the OAuth client credentials.

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: 'cookie_encryption_password',
        clientId: 'my_twitter_client_id',
        clientSecret: 'my_twitter_client_secret'
    });

    // Use the 'twitter' authentication strategy to protect the
    // endpoint handling the incoming authentication credentials.
    // This endpoints usually looks up the third party account in
    // the database and sets some application state (cookie) with
    // the local application account information.

    server.route({
        method: '*',            // Must be '*' to handle both GET and POST
        path: '/login',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {

                reply('Welcome ' + request.auth.credentials.username);
            }
        }
    });

    server.start();
});
```

