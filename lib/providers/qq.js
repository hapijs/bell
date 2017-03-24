'use strict';

exports = module.exports = function (options) {
	return {
		protocol: 'oauth2',
		auth: 'https://graph.qq.com/oauth2.0/authorize',
		useParamsAuth: true,
		token: 'https://graph.qq.com/oauth2.0/token',
		profile: function (credentials, params, get, callback) {
			const queryOptions = {
				access_token : params.access_token
			};
			credentials.profile = {provider: 'qq'};

			get('https://graph.qq.com/oauth2.0/me', queryOptions , (data) => {

				data = JSON.parse(data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1));

				get('https://graph.qq.com/user/get_user_info',{
					access_token: queryOptions.access_token,
					oauth_consumer_key: data.client_id,
					openid: data.openid
				}, (body) => {

				let json = JSON.parse(body);
				credentials.profile.id = data.openid;
				credentials.profile.nickname = json.nickname;
				credentials.profile.picture = json.figureurl_2 || json.figureurl_1 || json.figureurl || json.figureurl_qq_1 || json.figureurl_qq2 || '';
				credentials.profile._json = json;
				return callback();
			});
			return null;
		});
		}
	};
};