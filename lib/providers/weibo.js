'use strict';

exports = module.exports = function (options) {
	return {
		protocol: 'oauth2',
		auth: 'https://api.weibo.com/oauth2/authorize',
		useParamsAuth: true,
		token: 'https://api.weibo.com/oauth2/access_token',
		profile: function (credentials, params, get, callback) {

			const query = {
				access_token: params.access_token
			};

			credentials.profile = {provider: 'weibo'};
			get('https://api.weibo.com/2/account/get_uid.json', query, (body) => {
				let raw = JSON.parse(body);
				get('https://api.weibo.com/2/users/show.json',{
						uid: raw.uid,
						access_token: query.access_token
					}, (data) => {
					let user = JSON.parse(data);
					credentials.profile.id = user.id;
					credentials.profile.nickname = user.profile_url || user.screen_name || user.name;
					credentials.profile.picture = user.avatar_hd || '';
					credentials.profile._json = user;
					return callback();
				});
				return null;
			});
		}
	}
};