<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
### **bell**

**bell** is a third-party login plugin for [hapi](https://github.com/spumko/hapi). **bell** ships with built-in support for Facebook, GitHub,
Google, Twitter, Yahoo, and Windows Live. It also supports any compliant OAuth 1.0a and 2.0 based login services with a simple configuration
object.

[![Build Status](https://secure.travis-ci.org/spumko/bell.png)](http://travis-ci.org/spumko/bell)

### Usage

**bell** works by adding a login endpoint and setting it to use a **bell**-based authentication strategy. **bell** will manage the third-party
authentication flow and will only call the handler if the user successfully authenticated. The handler function is then used to examine the
third-party credentials (e.g. lookup an existing account or offer a registration page), setup an active session, and redirect to the actual
application.

**bell** does not maintain a session beyond a temporary state between the authorization flow. If a user authenticated once when accessing the
endpoint, they will have to authenticate again. This means **bell** cannot be used alone as a login system except for single-page applications
that require loading a single resource. Once the handler is called, the application must set its own session management. A common solution is to
combine **bell** with the [**hapi-auth-cookie**](https://github.com/spumko/hapi-auth-cookie) authentication scheme plugin.

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server(8000);

// Register bell with the server
server.pack.register(require('bell'), function (err) {

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
        path: '/login',         // The callback endpoint registered with the provider
        config: {
            auth: 'twitter',
            handler: function (request, reply) {

                // Perform any account lookup or registration, setup local session,
                // and redirect to the application. The third-party credentials are
                // stored in request.auth.credentials. Any query parameters from
                // the initial request are passed back via request.auth.credentials.query.
                return reply.redirect('/home');
            }
        }
    });

    server.start();
});
```

### Options

The `server.auth.strategy()` method requires the following strategy options:
- `provider` - the name of the third-party provider (`'facebook'`, `'github'`, `'google'`, `'live'`, `'twitter'`, `'yahoo'`) or an object
  containing a custom provider with the following:
    - `protocol` - the authorization protocol used. Must be one of:
        - `'oauth'` - OAuth 1.0a
        - `'oauth2'` - OAuth 2.0
    - `temporary` - the temporary credentials (request token) endpoint (OAuth 1.0a only).
    - `auth` - the authorization endpoint URI.
    - `token` - the access token endpoint URI.
    - `scope` - an array of scope strings (OAuth 2.0 only).
    - `scopeSeparator` - the scope separator character (OAuth 2.0 only). Only required when a provider has a broken OAuth 2.0 implementation.
      Defaults to space (Facebook and GitHut default to comma).
    - `headers` - a headers object with additional headers required by the provider (e.g. GitHub required the 'User-Agent' header which is
      set by default).
    - `profile` - a function used to obtain user profile information and normalize it. The function signature is
      `function(credentials, params, get, callback)` where:
        - `credentials` - the credentials object. Change the object directly within the function (profile information is typically stored
          under `credentials.profile`).
        - `params` - the parsed information received from the provider (e.g. token, secret, and other custom fields).
        - `get` - an OAuth helper function to make authenticated requests using the credentials received. The `get` function signature
          is `function(uri, params, callback)` where:
            - `uri` - the requested resource URI (**bell** will add the token or authentication header as needed).
            - `params` - any URI query parameters (cannot include them in the URI due to signature requirements).
            - `callback` - request callback with signature `function(response)` where `response` is the parsed payload (any errors are
              handled internally).
        - `callback` - the callback function which much be called once profile processing is complete.
- `password` - the cookie encryption password. Used to encrypt the temporary state cookie used by the module in between the authorization
  protocol steps.
- `clientId` - the OAuth client identifier (consumer key).
- `clientSecret` - the OAuth client secret (consumer secret).

Each strategy accepts the following optional settings:
- `cookie` - the name of the cookie used to manage the temporary state. Defaults to `'bell-provider'` where 'provider' is the provier name
  (or `'custom'` for custom providers). For example, the Twitter cookie name defaults to `'bell-twitter'`.
- `isSecure` - sets the cookie secure flag. Defaults to `true`.
- `isHttpOnly` - sets the cookie HTTP only flag. Defaults to `true`.
- `ttl` - cookie time-to-live in milliseconds. Defaults to `null` (session time-life - cookies are deleted when the browser is closed).
- `domain` - the domain scope. Defaults to `null` (no domain).
- `providerParams` - provider-specific query parameters for the authentication endpoint. Each provider supports its own set of parameters
  which customize the user's login experience. For example:
    - Facebook supports `display` ('page', 'popup', or 'touch'), `auth_type`, `auth_nonce`.
    - Google supports `access_type`, `approval_prompt`, `prompt`, `login_hint`, `user_id`, `hd`.
    - Twitter supports `force_login`, `screen_name`.
- `scope` - Each built-in vendor comes with the required scope for basic profile information. Use `scope` to specify a different scope
  as required by your application. Consult the provider for their specific supported scopes.
- `extendedProfile` - allows disabling the extra profile request when the provider returns the user information in the callback (e.g. Twitter).
  Defaults to `true`.
