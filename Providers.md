If you want to write your own provider please see the section at the bottom of this page.

## Existing Providers

Each provider may specify configuration options that are unique. Any of these unique options are documented here and must be provided during strategy creation. See the [API Documentation](API.md) for all other options.

### ArcGIS Online

[Provider Documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r30000009z000000)

- `scope`: No default scope
- `config`: not applicable
- `auth`: https://www.arcgis.com/sharing/rest/oauth2/authorize
- `token`: https://www.arcgis.com/sharing/rest/oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    provider: 'arcgisonline',
    orgId: profile.orgId,
    username: profile.username,
    displayName: profile.fullName,
    name: {
        first: profile.firstName,
        last: profile.lastName
    },
    email: profile.email,
    role: profile.role,
    raw: profile
};
```

### Bitbucket

[Provider Documentation](https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-238027431.html)

- `scope`: not applicable
- `config`: not applicable
- `temporary`: https://bitbucket.org/api/1.0/oauth/request_token
- `auth`: https://bitbucket.org/api/1.0/oauth/authenticate
- `token`: https://bitbucket.org/api/1.0/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {};
credentials.profile.id = profile.user.username;
credentials.profile.username = profile.user.username;
credentials.profile.displayName = profile.user.first_name + (profile.user.last_name ? ' ' + profile.user.last_name : '');
credentials.profile.raw = profile;
```

### Dropbox

[Provider Documentation](https://www.dropbox.com/developers/core/docs)

- `scope`: No default scope
- `config`: not applicable
- `auth`: https://www.dropbox.com/1/oauth2/authorize
- `token`: https://api.dropbox.com/1/oauth2/token

The default profile response will look like this:

```javascript
// default profile response from dropbox
```

### Facebook

[Provider Documentation](https://developers.facebook.com/docs/facebook-login/access-tokens)

- `scope`: Defaults to `['email']`
- `config`: not applicable
- `auth`: https://www.facebook.com/v2.3/dialog/oauth
- `token`: https://graph.facebook.com/v2.3/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    username: profile.username,
    displayName: profile.name,
    name: {
        first: profile.first_name,
        last: profile.last_name,
        middle: profile.middle_name
    },
    email: profile.email,
    raw: profile
};
```

### Foursquare

[Provider Documentation](https://developer.foursquare.com/overview/auth)

- `scope`: No default scope
- `config`: not applicable
- `auth`: https://foursquare.com/oauth2/authenticate
- `token`: https://foursquare.com/oauth2/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    displayName: profile.firstName + ' ' + profile.lastName,
    name: {
        first: profile.firstName,
        last: profile.lastName
    },
    email: profile.contact.email,
    raw: profile
};
```

### Github

[Provider Documentation](https://developer.github.com/v3/oauth/)

- `scope`: Defaults to `['user:email']`
- `config`:
  - `uri`: Point to your github enterprise uri. Defaults to `https://github.com`.
- `auth`: /login/oauth/authorize
- `token`: /login/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    username: profile.login,
    displayName: profile.name,
    email: profile.email,
    raw: profile
};
```

### Google

[Provider Documentation](https://developers.google.com/identity/protocols/OpenIDConnect)

You must also enable the Google+ API in your profile. Go to APIs & Auth, then APIs and under Social APIs click Google+ API and enable it.

- `scope`: Defaults to `['profile', 'email']`
- `config`: not applicable
- `auth`: https://accounts.google.com/o/oauth2/v2/auth
- `token`: https://www.googleapis.com/oauth2/v4/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    displayName: profile.displayName,
    name: profile.name,
    emails: profile.emails,
    raw: profile
};
```

### Instagram

[Provider Documentation](https://instagram.com/developer/authentication/)

- `scope`: Defaults to `['basic']`
- `config`:
  - `extendedProfile`: Boolean that determines if extended profile information will be fetched
- `auth`: https://api.instagram.com/oauth/authorize
- `token`: https://api.instagram.com/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: params.user.id,
    username: params.user.username,
    displayName: params.user.full_name,
    raw: params.user
};

// if extendedProfile is true then raw will have access to all the information
```

### LinkedIn

[Provider Documentation](https://developer.linkedin.com/docs/oauth2)

- `scope`: Defaults to `['r_basicprofile', 'r_emailaddress']`
- `config`: not applicable
- `auth`: https://www.linkedin.com/uas/oauth2/authorization
- `token`: https://www.linkedin.com/uas/oauth2/accessToken

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    name: {
        first: profile.firstName,
        last: profile.lastName
    },
    email: profile.email,
    headline: profile.headline,
    raw: profile
};
```

You can request additional profile fields by setting the `fields` option of `providerParams`. All possible fields are described in the [Basic Profile Fields documentation](https://developer.linkedin.com/docs/fields/basic-profile) (see an example on [this page](https://developer.linkedin.com/docs/signin-with-linkedin) under _Requesting additional profile fields_).

Here is an example of a custom strategy configuration:

```javascript
providerParams: {
    fields: ':(id,first-name,last-name,positions,picture-url,picture-urls::(original),email-address)'
}
```

### Meetup

[Provider Documentation](http://www.meetup.com/meetup_api/auth)

 - `scope`: Defaults to `['basic']`
 - `config`: not applicable
 - `auth`: https://secure.meetup.com/oauth2/authorize
 - `token`: https://secure.meetup.com/oauth2/access

The default profile response will look like this:

```javascript
// Defaults to meetup response (http://www.meetup.com/meetup_api/docs/2/member/#get)
```

### Microsoft Live

[Provider Documentation](https://msdn.microsoft.com/en-us/library/hh243647.aspx)

- `scope`: Defaults to `['wl.basic', 'wl.emails']`
- `config`: not applicable
- `auth`: https://login.live.com/oauth20_authorize.srf
- `token`: https://login.live.com/oauth20_token.srf

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    username: profile.username,
    displayName: profile.name,
    name: {
        first: profile.first_name,
        last: profile.last_name
    },
    email: profile.emails && (profile.emails.preferred || profile.emails.account),
    raw: profile
};
```

### Nest

[Provider Documentation](https://developer.nest.com/documentation/cloud/how-to-auth)

- `scope`: No default scope
- `config`: not applicable
- `auth`: https://home.nest.com/login/oauth2
- `token`: https://api.home.nest.com/oauth2/access_token

The default profile response will look like this:

```javascript
// According to the official docs, no user data is available via the Nest
// OAuth service. Therefore, there is no `profile`.
```

### Phabricator

[Provider Documentation](https://secure.phabricator.com/book/phabcontrib/article/using_oauthserver/)

- `scope`: Defaults to `['whoami']`
- `config`:
  - `uri`: URI of phabricator instance
- `auth`: /oauthserver/auth/
- `token`: /oauthserver/token/

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.result.phid,
    username: profile.result.userName,
    displayName: profile.result.realName,
    email: profile.result.primaryEmail,
    raw: profile
};
```

### Reddit

[Provider Documentation](https://github.com/reddit/reddit/wiki/OAuth2)

- `scope`: Defaults to `['identity']`
- `config`: not applicable
- `auth`: https://www.reddit.com/api/v1/authorize
- `token`: https://www.reddit.com/api/v1/access_token

The default profile response will look like this:

```javascript
// Defaults to reddit response
```

### Twitter

[Provider Documentation](https://dev.twitter.com/oauth)

- `scope`: not applicable
- `config`:
  - `extendedProfile`: Request for more profile information
- `temporary`: 'https://api.twitter.com/oauth/request_token'
- `auth`: https://api.twitter.com/oauth/authenticate
- `token`: https://api.twitter.com/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: params.user_id,
    username: params.screen_name
};

// credentials.profile.raw will contain extendedProfile if enabled
```

### Vk

[Provider Documentation](https://vk.com/dev/auth_sites)

- `scope`: No default scope
- `config`: not applicable
- `auth`: https://oauth.vk.com/authorize
- `token`: https://oauth.vk.com/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.uid,
    displayName: profile.first_name + ' ' + profile.last_name,
    name: {
        first: profile.first_name,
        last: profile.last_name
    },
    raw: profile
};
```

### Yahoo

[Provider Documentation](https://developer.yahoo.com/oauth/)

- `scope`: not applicable
- `config`: not applicable
- `temporary`: https://api.login.yahoo.com/oauth/v2/get_request_token
- `auth`: https://api.login.yahoo.com/oauth/v2/request_auth
- `token`: https://api.login.yahoo.com/oauth/v2/get_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.profile.guid,
    displayName: profile.profile.givenName + ' ' + profile.profile.familyName,
    name: {
        first: profile.profile.givenName,
        last: profile.profile.familyName
    },
    raw: profile
};
```

### Tumblr

[Provider Documentation](https://www.tumblr.com/docs/en/api/v2#auth)

- `scope`: not applicable
- `temporary`: https://www.tumblr.com/oauth/request_token
- `auth`: https://www.tumblr.com/oauth/authorize
- `token`: https://www.tumblr.com/oauth/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    username: profile.response.user.name,
    raw: profile.response.user
};

```

## Writing a new provider

When writing a new provider see existing implementations (in `lib/providers`) for reference as well as any documentation provided by your provider. You may want to support `uri` or `extendedProfile` options depending on your needs.
