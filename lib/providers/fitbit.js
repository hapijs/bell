'use strict';

exports = module.exports = function (options) {

	return {
		protocol: 'oauth2',
		useParamsAuth: false, 
		auth: 'https://www.fitbit.com/oauth2/authorize',
		token: 'https://api.fitbit.com/oauth2/token',
		scope: ['activity','nutrition','profile','settings','sleep','weight'],
		profile: function (credentials, params, get, callback) {
			
			get('https://api.fitbit.com/1/user/-/profile.json', null, function (profile) {

				credentials.profile = {
					id: profile.user.encodedId,
					displayName: profile.user.displayName,
					name: profile.user.fullName
				};

				return callback();
			});
		}
	};
};