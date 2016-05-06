'use strict';

exports = module.exports = function (options) {
	
	options = options || {};
	const uri = options.uri || 'https://sso.pingdevelopers.com';

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: uri + '/as/authorization.oauth2',
        token: uri + '/as/token.oauth2',
        // userinfo: uri + '/idp/userinfo.openid',
        scope: ['openid', 'email'],
	scopeSeparator: ' ',

        profile: function (credentials, params, get, callback) {
		
		const userUrl= uri + '/idp/userinfo.openid';

            	get(userUrl, null, (profile) => {
			//console.log(profile);

                	credentials.profile = {
                    		id: profile.sub,
                    		email: profile.email,
                    		username: profile.email,
                    		displayName: profile.email,
                    		raw: profile
                	};
               		console.log(credentials);
 
			return callback();
            });
        }
    };
};
