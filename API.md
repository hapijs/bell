## API

### Usage

**bell** works by adding a login endpoint and setting it to use a **bell**-based authentication strategy. **bell** will manage the third-party
authentication flow and will only call the handler if the user successfully authenticated. The handler function is then used to examine the
third-party credentials (e.g. lookup an existing account or offer a registration page), setup an active session, and redirect to the actual
application.

**bell** does not maintain a session beyond a temporary state between the authorization flow. If a user authenticated once when accessing the
endpoint, they will have to authenticate again. This means **bell** cannot be used alone as a login system except for single-page applications
that require loading a single resource. Once the handler is called, the application must set its own session management. A common solution is to
combine **bell** with the [**hapi-auth-cookie**](https://github.com/hapijs/hapi-auth-cookie) authentication scheme plugin.

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server();

server.connection({ port: 8000 });

// Register bell with the server
server.register(require('bell'), function (err) {

    // Declare an authentication strategy using the bell scheme
    // with the name of the provider, cookie encryption password,
    // and the OAuth client credentials.
    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: 'cookie_encryption_password',
        clientId: 'my_twitter_client_id',
        clientSecret: 'my_twitter_client_secret',
        isSecure: false     // Terrible idea but required if not using HTTPS
    });

    // Use the 'twitter' authentication strategy to protect the
    // endpoint handling the incoming authentication credentials.
    // This endpoints usually looks up the third party account in
    // the database and sets some application state (cookie) with
    // the local application account information.
    server.route({
        method: ['GET', 'POST'], // Must handle both GET and POST
        path: '/login',          // The callback endpoint registered with the provider
        config: {
            auth: 'twitter',
            handler: function (request, reply) {

                if (!request.auth.isAuthenticated) {
                    return reply('Authentication failed due to: ' + request.auth.error.message);
                }

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
- `provider` - the name of the third-party provider (`'bitbucket'`, `'dropbox'`, `'facebook'`, `'foursquare'`, `'github'`, `'google'`, `'instagram'`, `'linkedin'`, `'live'`, `'twitter'`, `'vk'`, `'arcgisonline'`, `'yahoo'`, `'nest'`, `'phabricator'`)
  or an object containing a custom provider with the following:
    - `protocol` - the authorization protocol used. Must be one of:
        - `'oauth'` - OAuth 1.0a
        - `'oauth2'` - OAuth 2.0
    - `temporary` - the temporary credentials (request token) endpoint (OAuth 1.0a only).
    - `useParamsAuth` - boolean that determines if OAuth client id and client secret will be sent as parameters as opposed to an Authorization header (OAuth 2.0 only). Defaults to `false`.
    - `auth` - the authorization endpoint URI.
    - `token` - the access token endpoint URI.
    - `version` - the OAuth version.
    - `scope` - an array of scope strings (OAuth 2.0 only).
    - `scopeSeparator` - the scope separator character (OAuth 2.0 only). Only required when a provider has a broken OAuth 2.0 implementation.
      Defaults to space (Facebook and GitHub default to comma).
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
- `forceHttps` - A boolean indicating whether or not you want the redirect_uri to be forced to https. Useful if your hapi application runs as http, but is accessed through https.
- `location` - Set the base redirect_uri manually if it cannot be inferred properly from server settings. Useful to override port, protocol, and host if proxied or forwarded.

Each strategy accepts the following optional settings:
- `cookie` - the name of the cookie used to manage the temporary state. Defaults to `'bell-provider'` where 'provider' is the provider name
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
    - Linkedin supports `fields`.
- `allowRuntimeProviderParams` - allows passing query parameters from a **bell** protected endpoint to the auth request. It will merge the query params you pass along with the providerParams and any other predefined ones. Be aware that this will override predefined query parameters! Default to `false`.
- `scope` - Each built-in vendor comes with the required scope for basic profile information. Use `scope` to specify a different scope
  as required by your application. Consult the provider for their specific supported scopes.
- `config` - a configuration object used to customize the provider settings. The built-in `'twitter'` provider accepts the `extendedProfile`
  option which allows disabling the extra profile request when the provider returns the user information in the callback (defaults to `true`).
  The built-in `'github'` and `'phabricator'` providers accept the `uri` option which allows pointing to a private enterprise installation
  (e.g. `'https://vpn.example.com'`). See [Providers documentation](Providers.md) for more information.
- `profileParams` - an object of key-value pairs that specify additional URL query parameters to send with the profile request to the provider.
   The built-in `facebook` provider, for example, could have `fields` specified to determine the fields returned from the user's graph, which would
   then be available to you in the `auth.credentials.profile.raw` object.

### Advanced Usage

#### Configuration via Environment Variables

The `server.auth.strategy()` method supports string representations of its boolean and number typed options.
For example, `forceHttps` can be set to 'true', 'false', 'yes', or 'no'. In effect, this allows you to configure any strategy option using environment variables.

#### Handling Errors

By default, **bell** will reply back with an internal error (500) on most authentication errors due to the nature of the OAuth protocol.
There is little that can be done to recover from errors as almost all of them are caused by implementation or deployment issues.

If you would like to display a useful error page instead of the default JSON response, use the **hapi**
[`onPreResponse`](http://hapijs.com/api#error-transformation) extension point to transform the
error into a useful page or to redirect the user to another destination.

Another way to handle authentication errors is within the route handler. By default, an authentication error will cause the handler to be
skipped. However, if the authentication mode is set to `'try'` instead of `'required'`, the handler will still be called. In this case,
the `request.auth.isAuthenticated` must be checked to test if authentication failed. In that case, `request.auth.error` will contain the error.

#### Token Refresh

To keep track of the token expiry time, `request.auth.credentials.expiresIn` provides you the duration (in seconds) after which you could send a refresh token request using the `request.auth.credentials.refreshToken` to get a new token.

### Usage without a strategy

Sometimes, you want to use bell without using specifying a Hapi strategy. This can be the case when combining the auth logic together with another module.

**bell** exposes an oauth object in its plugin. Therefore, `server.plugins.bell.oauth` now has all that's needed. For example, calling the `v2` method with all the settings documented above, will handle the oauth2 flow.
