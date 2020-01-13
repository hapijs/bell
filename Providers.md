If you want to write your own provider please see the section at the bottom of this page.

## Existing Providers

Each provider may specify configuration options that are unique. Any of these unique options are
documented here and must be provided during strategy creation. See the [API Documentation](API.md)
for all other options.

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

Specific fields may vary depending on the identity provider used. For more information,
[refer to the documentation on user profiles](https://auth0.com/docs/user-profile/normalized).

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

### Cognito

[Provider Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-userpools-server-contract-reference.html)

- `scope`: Defaults to `['openid', 'email', 'profile']`
- `config`:
  - `uri`: Point to your Cognito user pool uri.  Intentionally no default as Cognito is organization specific.
- `auth`: https://your-cognito-user-pool.amazoncognito.com/oauth2/authorize
- `token`: https://your-cognito-user-pool.amazoncognito.com/oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.sub,
    username: profile.preferred_username,
    displayName: profile.name,
    firstName: profile.given_name,
    lastName: profile.family_name,
    email: profile.email,
    raw: profile
};
```

### DigitalOcean

[Provider Documentation](https://developers.digitalocean.com/documentation/oauth)

- `scope`: defaults to `read` scope
- `config`: not applicable
- `auth`: https://cloud.digitalocean.com/v1/oauth/authorize
- `token`: https://cloud.digitalocean.com/v1/oauth/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.account.uuid,
    email: profile.account.email,
    status: profile.account.status,
    dropletLimit: profile.account.droplet_limit,
    raw: profile.account
};
```

### Discord

[Provider Documentation](https://discordapp.com/developers/docs/topics/oauth2)

- `scope`: Defaults to `['email', 'identify']`
- `config`: not applicable
- `auth`: https://discordapp.com/api/oauth2/authorize
- `token`: https://discordapp.com/api/oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    discriminator: profile.discriminator,
    username: profile.username,
    email: profile.email,
    mfa_enabled: profile.mfa_enabled,
    verified: profile.verified,
    avatar: {
        id: profile.avatar,
        url: 'https://discordapp.com/api/users/' + profile.id + '/avatars/' + profile.avatar + '.jpg'
    },
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
- `config`:
  - `fields`: List of profile fields to retrieve, as described in [Facebook's documentation](https://developers.facebook.com/docs/graph-api/reference/user). Defaults to `'id,name,email,first_name,last_name,middle_name,gender,link,locale,timezone,updated_time,verified'`.
- `auth`: https://www.facebook.com/v3.1/dialog/oauth
- `token`: https://graph.facebook.com/v3.1/oauth/access_token

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

### Fitbit

[Provider Documentation](https://dev.fitbit.com/docs/oauth2/)

- `scope`: Defaults to `['activity', 'profile']`
- `config`: not applicable
- `auth`: https://www.fitbit.com/oauth2/authorize
- `token`: https://api.fitbit.com/oauth2/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.user.encodedId,
    displayName: profile.user.displayName,
    name: profile.user.fullName
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

- `scope`: Defaults to `['profile', 'email']`
- `config`: not applicable
- `auth`: https://accounts.google.com/o/oauth2/v2/auth
- `token`: https://www.googleapis.com/oauth2/v4/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    displayName: profile.name,
    name: {
        given_name: profile.given_name,
        family_name: profile.family_name
    },
    email: profile.email,
    raw: profile
};
```

### Google Plus

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

### Medium

[Provider Documentation](https://github.com/Medium/medium-api-docs)

 - `scope`: Defaults to `['basicProfile']`
 - `config`: not applicable
 - `auth`: https://medium.com/m/oauth/authorize
 - `token`: https://medium.com/v1/tokens

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.data.id,
    username: profile.data.username,
    displayName: profile.data.name,
    raw: profile.data
};
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

### Mixer

[Provider Documentation](https://dev.mixer.com/reference/oauth/index.html)

- `scope`: Defaults to `['user:details:self']`
- `config`: not applicable
- `auth`: https://mixer.com/oauth/authorize
- `token`: https://mixer.com/api/v1/oauth/token

The default profile response will look like this:

```javascript
//Default profile response from Mixer
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

### Pingfed

[Provider Documentation](https://www.pingidentity.com/content/developer/en/resources/openid-connect-developers-guide.html)

- `scope`: Defaults to `['openid', 'email']`
- `config`:
  - `uri`: Point to your Pingfederate enterprise uri.  Intentionally no default as Ping is organization specific.
- `auth`: https://www.example.com:9031/as/authorization.oauth2
- `token`: https://www.example.com:9031/as/token.oauth2

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.sub,
    username: profile.email,
    displayName: profile.email,
    email: profile.email,
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

### Spotify

[Provider Documentation](https://developer.spotify.com/web-api/)

- `scope`: Defaults to `-` allowing to read the public information only. [Spotify Scopes](https://developer.spotify.com/web-api/using-scopes/)
- `auth`: https://accounts.spotify.com/authorize
- `token`: https://accounts.spotify.com/api/token

Read more about the Spotify Web API's Authorization Flow here: [https://developer.spotify.com/web-api/authorization-guide/](https://developer.spotify.com/web-api/authorization-guide/)

The default profile response will look like this:

```javascript
credentials.profile = {
  id: profile.id,
  username: profile.id,
  displayName: profile.display_name,
  email: profile.email,
  raw: profile
}
```

### trakt.tv

[Provider Documentation](http://docs.trakt.apiary.io/#reference/authentication-oauth)

- `scope`: not applicable
- `config`: not applicable
- `auth`: https://api.trakt.tv/oauth/authorize
- `token`: https://api.trakt.tv/oauth/token

The default profile response will look like this:

```javascript
credentials.profile = {
    username: profile.username,
    private: profile.private,
    joined_at: profile.joined_at,
    name: profile.name,
    vip: profile.vip,
    ids: profile.ids,
    location: profile.location,
    about: profile.about,
    gender: profile.gender,
    age: profile.age,
    images: profile.images
};
```

### Twitter

[Provider Documentation](https://dev.twitter.com/oauth)

- `scope`: not applicable
- `config`:
  - `extendedProfile`: Request for more profile information
  - `getMethod`: [Twitter API](https://dev.twitter.com/rest/public) GET method to call when `extendedProfile` is enabled. Defaults to `'users/show'`
  - `getParams`: Additional parameters to pass to the GET method. For example, the `include_email` parameter for the [`account/verify` route](https://dev.twitter.com/rest/reference/get/account/verify_credentials)
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
  - `uri`: Point to your Salesforce org. Defaults to `https://login.salesforce.com`
  - `extendedProfile`: Request for more profile information. Defaults to true
  - `identityServiceProfile`: Determines if the profile information fetch uses the [Force.com Identity Service](https://developer.salesforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com#The_Force.com_Identity_Service). Defaults to false (UserInfo Endpoint)
- `auth`: /services/oauth2/authorize
- `token`: /services/oauth2/token

The default profile response will look like this: [UserInfo Response](https://developer.salesforce.com/page/Inside_OpenID_Connect_on_Force.com#User_Profile_Service)

```javascript
credentials.profile = {
    "sub": "https://login.salesforce.com/id/00Dx0000000A9y0EAC/005x0000000UnYmAAK",
    "user_id": "005x0000000UnYmAAK",
    "organization_id": "00Dx0000000A9y0EAC",
    "preferred_username": "user@ example.com",
    "nickname": "user",
    "name": "Pat Patterson",
    "email": "user@ example.com",
    "email_verified": true,
    "given_name": "Pat",
    "family_name": "Patterson",
    ...
}
```

The Force.com Identity profile response will look like this: [Force.com Identity Response](https://developer.salesforce.com/page/Digging_Deeper_into_OAuth_2.0_on_Force.com#The_Force.com_Identity_Service)

```javascript
credentials.profile = {
    "id":"https://login.salesforce.com/id/00D50000000IZ3ZEAW/00550000001fg5OAAQ",
    "asserted_user":true,
    "user_id":"00550000001fg5OAAQ",
    "organization_id":"00D50000000IZ3ZEAW",
    "username":"user@ example. com",
    "nick_name":"user1.2950476911907334E12",
    "display_name":"Sample User",
    "email":"user@ example. com",
    "email_verified": true,
    "first_name": "Sample",
    "last_name": "User",
    ...
}
```

### Stripe

[Provider Documentation](https://stripe.com/docs/connect/oauth-reference)

- `scope`: defaults to `read_only` scope
- `config`: not applicable
- `auth`: https://connect.stripe.com/oauth/authorize
- `token`: https://connect.stripe.com/oauth/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.id,
    legalName: profile.business_name,
    displayName: profile.display_name,
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

### Okta

[Provider Documentation](http://developer.okta.com/use_cases/authentication/)

- `scope`: Defaults to `['openid', 'email', 'offline_access']`
- `config`:
  - `uri`: Point to your Okta enterprise uri.  Intentionally no default as Okta is organization specific.
  - `authorizationServerId`: If you are using a [custom authorization server](https://support.okta.com/help/s/article/Difference-Between-Okta-as-An-Authorization-Server-vs-Custom-Authorization-Server) you need to pass the alphanumeric ID here.
- `auth`: https://your-organization.okta.com/oauth2/v1/authorize
- `token`: https://your-organization.okta.com/oauth2/v1/token

The default profile response will look like this:

```javascript
credentials.profile = {
    id: profile.sub,
    username: profile.email,
    displayName: profile.nickname,
    firstName: profile.given_name,
    lastName: profile.family_name,
    email: profile.email,
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
