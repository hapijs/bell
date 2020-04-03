
### Introduction

**bell** ships with built-in support for authentication using `ArcGIS Online`, `Auth0`, `AzureAD`,
`BitBucket`, `Cognito`, `DigitalOcean`, `Discord`, `Dropbox`, `Facebook`, `Fitbit`, `Foursquare`,
`GitHub`, `GitLab`, `Google Plus`, `Google`, `Instagram`, `LinkedIn`, `Medium`, `Meetup`, `Mixer`,
`Nest`, `Office365`, `Okta`, `Phabricator`, `Pingfed`, `Pinterest`, `Reddit`, `Salesforce`, `Slack`,
`Spotify`, `Stripe`, `trakt.tv`, `Tumblr`, `Twitch`, `Twitter`, `VK`, `Wordpress`, `Windows Live`,
and `Yahoo`.

It also supports any compliant `OAuth 1.0a` and `OAuth 2.0` based login services with a simple
configuration object.

[**Providers Documentation**](https://hapi.dev/family/bell/providers)

### Tutorials

[**Social Login with Twitter using hapi.js**](http://mph-web.de/social-signup-with-twitter-using-hapi-js/)

### Examples

[**All Examples**](https://github.com/hapijs/bell/tree/master/examples)

Twitter:

```js
// Load modules

const Bell = require('@hapi/bell');
const Hapi = require('@hapi/hapi');


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
    // This endpoint usually looks up the third party account in
    // the database and sets some application state (cookie) with
    // the local application account information.

    server.route({
        method: ['GET', 'POST'],    // Must handle both GET and POST
        path: '/login',             // The callback endpoint registered with the provider
        options: {
            auth: {
              mode: 'try',
              strategy: 'twitter'
            },
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

### Notes

Testing third-party authorization is often a painful process. They are hard to test, tidious to configure, and tend to break when running on local servers. If you are having issues running **bell** locally, you might want to look at the `isSecure` and `isSameSite` options. Since most people don't run TLS on their local test server, `isSecure` must be set to `false` to remove the TLS requirement. `isSameSite` might need to be set to `'Lax'` in some cases.

You should also review the default scope set for each provider early in your implementation. The default scope is meant to get the minimal permissions needed to perform simple user login. In most cases, you would want to ask for more permissions as the default often does not provide access to most API calls provided by the third-party services.

### Usage

**bell** works by adding a login endpoint and setting it to use a **bell**-based authentication strategy. **bell** will manage the third-party authentication flow and will only call the handler if the user successfully authenticated. The handler function is then used to examine the third-party credentials (e.g. lookup an existing account or offer a registration page), setup an active session, and redirect to the actual application.

**bell** does not maintain a session beyond a temporary state between the authorization flow. If a user authenticated once when accessing the endpoint, they will have to authenticate again. This means **bell** cannot be used alone as a login system except for single-page applications that require loading a single resource. Once the handler is called, the application must set its own
session management. A common solution is to combine **bell** with the [**@hapi/cookie**](https://hapi.dev/family/cookie) authentication scheme plugin.

```js
// Load modules

const Bell = require('@hapi/bell');
const Hapi = require('@hapi/hapi');


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
            auth: {
              mode: 'try',
              strategy: 'twitter'
            },
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


### Options

The `server.auth.strategy()` method requires the following strategy options:

- `provider` - the name of the third-party provider (`'auth0'`, `'azure'`, `'bitbucket'`,
  `'dropbox'`, `'facebook'`, `'fitbit'`, `'foursquare'`, `'github'`, `'google'`, `'googleplus'`,
  `'instagram'`, `'linkedin'`, `'live'`, `'twitter'`, `'vk'`, `'arcgisonline'`, `'yahoo'`,
  `'nest'`, `'phabricator'`, `'pinterest'`) or an object containing a custom
  provider with the following:

    - `name` - the custom provider name. Defaults to `custom`.
    - `protocol` - the authorization protocol used. Must be one of:
        - `'oauth'` - OAuth 1.0a
        - `'oauth2'` - OAuth 2.0
    - `signatureMethod` - the OAuth signature method (OAuth 1.0a only). Must be one of:
        - `'HMAC-SHA1'` - default
        - `'RSA-SHA1'` - in that case, the `clientSecret` is your RSA private key
    - `temporary` - the temporary credentials (request token) endpoint (OAuth 1.0a only).
    - `useParamsAuth` - boolean that determines if OAuth client id and client secret will be sent
      as parameters as opposed to an Authorization header (OAuth 2.0 only). Defaults to `false`.
    - `auth` - the authorization endpoint URI.
    - `token` - the access token endpoint URI.
    - `scope` - an array of scope strings (OAuth 2.0 only).
    - `scopeSeparator` - the scope separator character (OAuth 2.0 only). Only required when a
      provider has a broken OAuth 2.0 implementation. Defaults to space (Facebook and GitHub
      default to comma).
    - `headers` - a headers object with additional headers required by the provider (e.g. GitHub
      required the 'User-Agent' header which is set by default).
    - `profileMethod` - `get` or `post` for obtaining user profile by `profile` function. Default
      is `get`.
    - `profile` - a function used to obtain user profile information and normalize it. The function
      signature is `async function(credentials, params, get)` where:
        - `credentials` - the credentials object. Change the object directly within the function
          (profile information is typically stored under `credentials.profile`).
        - `params` - the parsed information received from the provider (e.g. token, secret, and
          other custom fields).
        - `get` - an OAuth helper function to make authenticated requests using the credentials
          received. The `get` function signature is `async function(uri, params)` where:
            - `uri` - the requested resource URI (**bell** will add the token or authentication
              header as needed).
            - `params` - any URI query parameters (cannot include them in the URI due to signature
              requirements).
            - returns the parsed profile response object.

- `password` - the cookie encryption password. Used to encrypt the temporary state cookie used by
  the module in between the authorization protocol steps.
- `clientId` - the OAuth client identifier (consumer key).
- `clientSecret` - the OAuth client secret (consumer secret). This is usually a client password
  formatted as a *string*, but to allow [OAuth2 custom client authentication](https://tools.ietf.org/html/rfc6749#section-2.3)
  (e.g. client certificate-based authentication), this option can be passed as an *object*. This
  object will be merged with the Wreck request object used to call the token endpoint. Such an
  object can contain custom HTTP headers or TLS options (e.g.
  `{ agent: new Https.Agent({ cert: myClientCert, key: myClientKey}) }`).
- `forceHttps` - A boolean indicating whether or not you want the redirect_uri to be forced to
  https. Useful if your hapi application runs as http, but is accessed through https.
- `location` - Set the base redirect_uri manually if it cannot be inferred properly from server
  settings. Useful to override port, protocol, and host if proxied or forwarded. It may be passed
  either as a string (in which case request.path is appended for you), or a function which takes
  the client's `request` and returns a non-empty string, which is used as provided. In both cases,
  an empty string will result in default processing just as if the `location` option had not been
  specified.

Each strategy accepts the following optional settings:

- `cookie` - the name of the cookie used to manage the temporary state. Defaults to
  `'bell-provider'` where 'provider' is the provider name. For
  example, the Twitter cookie name defaults to `'bell-twitter'`.
- `isSameSite` - sets the cookie same site option. Defaults to `Strict`.
- `isSecure` - sets the cookie secure flag. Defaults to `true`.
- `isHttpOnly` - sets the cookie HTTP only flag. Defaults to `true`.
- `ttl` - cookie time-to-live in milliseconds. Defaults to `null` (session time-life - cookies are
  deleted when the browser is closed).
- `domain` - the domain scope. Defaults to `null` (no domain).
- `providerParams` - provider-specific query parameters for the authentication endpoint. It may be
  passed either as an object to merge into the query string, or a function which takes the client's
  `request` and returns an object. Each provider supports its own set of parameters which customize
  the user's login experience. For example:
    - Facebook supports `display` ('page', 'popup', or 'touch'), `auth_type`, `auth_nonce`.
    - Google supports `access_type`, `approval_prompt`, `prompt`, `login_hint`, `user_id`, `hd`.
    - Twitter supports `force_login`, `screen_name`.
    - Linkedin supports `fields`.
- `allowRuntimeProviderParams` - allows passing query parameters from a **bell** protected endpoint
  to the auth request. It will merge the query params you pass along with the providerParams and
  any other predefined ones. Be aware that this will override predefined query parameters! Default
  to `false`.
- `scope` - Each built-in vendor comes with the required scope for basic profile information. Use
  `scope` to specify a different scope as required by your application. It may be passed either as
  an object to merge into the query string, or a function which takes the client's `request` and
  returns an object. Consult the provider for their specific supported scopes.
- `skipProfile` - skips obtaining a user profile from the provider. Useful if you need specific
  `scope`s, but not the user profile. Defaults to `false`.
- `config` - a configuration object used to customize the provider settings:
    - Twitter:
        - `extendedProfile`
        - `getMethod`
    - GitHub and Phabricator:
        - `uri` - allows pointing to a private enterprise installation (e.g.
          `'https://vpn.example.com'`). See [Providers documentation](https://github.com/hapijs/bell/blob/master/Providers.md) for more
          information.
- `profileParams` - an object of key-value pairs that specify additional URL query parameters to
  send with the profile request to the provider. The built-in `facebook` provider, for example,
  could have `fields` specified to determine the fields returned from the user's graph, which would
   then be available to you in the `auth.credentials.profile.raw` object.
- `runtimeStateCallback` - allows passing additional OAuth state from initial request. This must be
  a function returning a string, which will be appended to the **bell** internal `state` parameter
  for OAuth code flow.

### Authentication information
On route handlers, the [authentication object](https://hapi.dev/api/#request.auth) may contain one or more of the following properties depending on your route configuration and whether the authentication process was completed successfully or not:

#### Always present

```javascript
auth.credentials = {
  provider: String, // provider name
};
```

#### Present on successful authentication

##### OAuth protocol

```javascript
auth.credentials = {
  token: String,
  secret: String,
  query: Object // sign-in request query params
};
```

##### OAuth2 protocol

```javascript
auth.credentials = {
  token: String,
  refreshToken: String,
  expiresIn: Number,
  query: Object // sign-in request query params
};

auth.artifacts = Object; // OAuth token payload response
```

##### Present on failed authentication (route.auth.mode=try)

```javascript
auth.credentials = {
  query: Object // sign-in request query params
};
```

### Advanced Usage

#### Configuration via Environment Variables

The `server.auth.strategy()` method supports string representations of its boolean and number typed
options. For example, `forceHttps` can be set to 'true', 'false', 'yes', or 'no'. In effect, this
allows you to configure any strategy option using environment variables.

#### Handling Errors

By default, **bell** will reply back with an internal error (500) on most authentication errors due
to the nature of the OAuth protocol. There is little that can be done to recover from errors as
almost all of them are caused by implementation or deployment issues.

If you would like to display a useful error page instead of the default JSON response, use the
**hapi** [`onPreResponse`](https://hapi.dev/api#error-transformation) extension point to transform
the error into a useful page or to redirect the user to another destination.

Another way to handle authentication errors is within the route handler. By default, an
authentication error will cause the handler to be skipped. However, if the authentication mode is
set to `'try'` instead of `'required'`, the handler will still be called. In this case, the
`request.auth.isAuthenticated` must be checked to test if authentication failed. In that case,
`request.auth.error` will contain the error.

#### Token Refresh

To keep track of the token expiry time, `request.auth.credentials.expiresIn` provides you the
duration (in seconds) after which you could send a refresh token request using the
`request.auth.credentials.refreshToken` to get a new token.

#### Simulated authentication

Testing applications using third-party login can be challenging given the lack of user interaction
to perform the third-party login flow as well as the multiple steps required. To assist in testing
such application without having to modify the application with custom code, **Bell** provides an
override method `Bell.simulate()` which puts the module into simulation mode and any strategies
created while it is in this mode will return the simulated credentials.

The `Bell.simulate(credentialsFunc)` takes a single argument:

- `credentialsFunc` - a function called for each incoming request to the protected resource that
  should return the credentials object to be set in `request.auth.credentials`. Note that **bell**
  will set the default keys automatically if not present except for the provider-specific values.
  
  has the signature `function(request)` where:
    - `request` - the **hapi** request object.

Note that you must call `Bell.simulate()` before the module is registered by your application and
need to call `Bell.simulate(false)` to stop it from simulating authentication.

### Usage without a strategy

Sometimes, you want to use bell without using specifying a Hapi strategy. This can be the case when
combining the auth logic together with another module.

**bell** exposes an oauth object in its plugin. Therefore, `server.plugins.bell.oauth` now has all
that's needed. For example, calling the `v2` method with all the settings documented above, will
handle the oauth2 flow.

### Customized Scope and Params

You can pass a function, rather than an object, into the `providerParams` and `scope` config
options to allow you to customize the scope or parameters based on the user's request. For example,
this may be used you want people to be able to log in with a provider (and only need some basic
user information) but also want to let users authorize your application to post messages or status
updates on their behalf.

```js
server.auth.strategy('twitter', 'bell', {
    provider: 'twitter',
    password: 'some cookie password',
    location: 'http://example.com/oauth',
    scope(request) {

        const scopes = ['public_profile', 'email'];
        if (request.query.wantsSharePermission) {
          scopes.push('publish_actions');
        }
        return scopes;
    }
});
```
