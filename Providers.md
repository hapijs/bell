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

### Auth0

[Provider Documentation](https://auth0.com/docs/protocols#oauth-server-side)

- `scope`: not applicable
- `config`:
  - `domain`: Your Auth0 domain name, such as `example.auth0.com` or `example.eu.auth0.com`
- `auth`: [/authorize](https://auth0.com/docs/auth-api#!#get--authorize_social)
- `token`: [/oauth/token](https://auth0.com/docs/protocols#3-getting-the-access-token)

To authenticate a user with a specific identity provider directly, use `providerParams`. For example:

```javascript
providerParams: {
    connection: 'Username-Password-Authentication'
}
```

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.user_id,
    email: profile.email,
    displayName: profile.name,
    name: {
        first: profile.given_name,
        last: profile.family_name
    },
    raw: profile
};
```

Specific fields may vary depending on the identity provider used. For more information, [refer to the documentation on user profiles](https://auth0.com/docs/user-profile/normalized).

### Bitbucket

[Provider Documentation](https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-238027431.html)

- `scope`: not applicable
- `config`: not applicable
- `auth`: https://bitbucket.org/site/oauth2/authorize
- `token`: https://bitbucket.org/site/oauth2/access_token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.uuid,
    username: profile.username,
    displayName: profile.display_name,
    raw: profile
};
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

### GitLab

[Provider Documentation](https://gitlab.com/help/api/oauth2.md)

- `scope`: No default scope.
- `config`:
  - `uri`: Point to your gitlab uri. Defaults to `https://gitlab.com`.
- `auth`: /oauth/authorize
- `token`: /oauth/token

The default profile response will look like this:

```javascript
// Defaults to gitlab response (https://gitlab.com/help/api/users.md#current-user)
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

### Pinterest

[Provider Documentation](https://developers.pinterest.com/docs/api/overview/)

- `scope`: Defaults to `['read_public', 'write_public', 'read_relationships', 'write_relationships']`
- `config`: not applicable
- `auth`: https://api.pinterest.com/oauth/
- `token`: https://api.pinterest.com/v1/oauth/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.data.id,
    username: profile.data.username,
    name: {
        first: profile.data.first_name,
        last: profile.data.last_name
    },
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

### Slack

[Provider Documentation](https://api.slack.com/docs/oauth)

- `scope`: Defaults to `['identify']`
- `config`:
  - `extendedProfile`: Set to `false` if all you want is the `access_token`, without `user_id`, `user`, `raw`, etc...
- `auth`: https://slack.com/oauth/authorize
- `token`: https://slack.com/api/oauth.access

To authenticate user in a specific team, use `providerParams`. For example:
```javascript
providerParams: {
    team: 'T0XXXXXX'
}
```

The default profile response will look like this:

```javascript
credentials.profile = {
  scope: params.scope,
  access_token: params.access_token,
  user: params.user,
  user_id: params.user_id
}

// credentials.profile.raw will contain all of the keys sent by Slack for the `auth.test` method
```

### Twitter

[Provider Documentation](https://dev.twitter.com/oauth)

- `scope`: not applicable
- `config`:
  - `extendedProfile`: Request for more profile information
  - `getMethod`: [Twitter API](https://dev.twitter.com/rest/public) GET method to call when `extendedProfile` is enabled. Defaults to `'users/show'`
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

### Twitch

[Provider Documentation](https://github.com/justintv/Twitch-API/blob/master/authentication.md)

- `scope`: Defaults to `'user_read'`
- `auth`: https://api.twitch.tv/kraken/oauth2/authorize
- `token`: https://api.twitch.tv/kraken/oauth2/token

The default profile response will look like this:

```javascript
// default profile response from Twitch
```

### Salesforce

[Provider Documentation](https://developer.salesforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com)

- `scope`: not applicable
- `config`:
  - `uri`: Point to your Salesforce org. Defaults to `https://login.salesforce.com`.
- `auth`: /services/oauth2/authorize
- `token`: /services/oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.user_id,
    username: profile.username,
    displayName: profile.display_name,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    raw: profile
};
```
### Office 365

[Provider Documentation](https://msdn.microsoft.com/en-us/library/azure/dn645545.aspx)


- `scope`: Defaults to `['openid','offline_access', 'profile']`
- `config`: not applicable
- `auth`: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
- `token`: https://login.microsoftonline.com/common/oauth2/v2.0/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.Id,
    displayName: profile.DisplayName,
    email: profile.EmailAddress,
    raw: profile
};
```


### WordPress

[Provider Documentation](https://developer.wordpress.com/docs/api/)

- `scope`: Defaults to `'global'`
- `auth`: /oauth2/authorize
- `token`: /oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.ID,
    username: profile.username,
    displayName: profile.display_name,
    raw: profile
};
```

## Writing a new provider

When writing a new provider see existing implementations (in `lib/providers`) for reference as well as any documentation provided by your provider. You may want to support `uri` or `extendedProfile` options depending on your needs.
