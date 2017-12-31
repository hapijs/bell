

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://foursquare.com/oauth2/authenticate',
        token: 'https://foursquare.com/oauth2/access_token',
        profile: async function (credentials, params, get) {

            const query = {
                v: '20140701',
                oauth_token: credentials.token
            };

            const { response: { user: profile } } = await get('https://api.foursquare.com/v2/users/self', query);

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
        }
    };
};
