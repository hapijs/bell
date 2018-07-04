# **bell**

Third-party authentication plugin for [hapi](https://github.com/hapijs/hapi).

Lead Maintainer: [Adri Van Houdt](https://github.com/adrivanhoudt)

[![Build Status](https://secure.travis-ci.org/hapijs/bell.png)](http://travis-ci.org/hapijs/bell)

**bell** ships with built-in support for authentication using `Facebook`, `GitHub`, `Google`,
`Google Plus`, `Instagram`, `LinkedIn`, `Slack`, `Stripe`, `Twitter`, `Yahoo`, `Foursquare`,
`VK`, `ArcGIS Online`, `Windows Live`, `Nest`, `Phabricator`, `BitBucket`, `Dropbox`, `Reddit`,
`Tumblr`, `Twitch`, `Mixer`, `Salesforce`, `Pinterest`, `Discord`, `DigitalOcean`, `AzureAD`,
`trakt.tv` and `Okta`.

It also supports any compliant `OAuth 1.0a` and `OAuth 2.0` based login services with a simple
configuration object.

## Sponsor

<img align="left" src="https://user-images.githubusercontent.com/83319/31722733-de95bbde-b3ea-11e7-96bf-4f4e8f915588.png" /> If you want to add secure authentication to apps or APIs, feel free to check out Auth0's SDKs and free plan at  [auth0.com/overview](https://auth0.com/overview?utm_source=GHsponsor&utm_medium=GHsponsor&utm_campaign=hapijsbell&utm_content=auth).

<br>

## Documentation

[**API Documentation**](API.md)

[**Providers Documentation**](Providers.md)

## Tutorials

[**Social Login with Twitter using hapi.js**](http://mph-web.de/social-signup-with-twitter-using-hapi-js/)

## Examples

[**All Examples**](/examples)

Twitter:

```js
// Load modules

const Bell = require('bell');
const Hapi = require('hapi');


// Declare internals

const internals = {};


internals.start = async function () {

    const server = Hapi.server({ port: 8000 });

    // Register bell with the server

    await server.register(Bell);

    // Declare an authentication strategy using the bell scheme
    // with the name of the provider, cookie encryption password,
    // and the OAuth client credentials.

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: 'cookie_encryption_password_secure',
        clientId: 'my_twitter_client_id',
        clientSecret: 'my_twitter_client_secret',
        isSecure: false     // Terrible idea but required if not using HTTPS especially if developing locally
    });

    // Use the 'twitter' authentication strategy to protect the
    // endpoint handling the incoming authentication credentials.
    // This endpoints usually looks up the third party account in
    // the database and sets some application state (cookie) with
    // the local application account information.

    server.route({
        method: ['GET', 'POST'],    // Must handle both GET and POST
        path: '/login',             // The callback endpoint registered with the provider
        options: {
            auth: 'twitter',
            handler: function (request, h) {

                if (!request.auth.isAuthenticated) {
                    return `Authentication failed due to: ${request.auth.error.message}`;
                }

                // Perform any account lookup or registration, setup local session,
                // and redirect to the application. The third-party credentials are
                // stored in request.auth.credentials. Any query parameters from
                // the initial request are passed back via request.auth.credentials.query.

                return h.redirect('/home');
            }
        }
    });

    await server.start();
};

internals.start();
```
