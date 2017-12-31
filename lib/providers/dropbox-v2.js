

exports = module.exports = function (options) {

    return {
        protocol: 'oauth2',
        useParamsAuth: true,
        auth: 'https://www.dropbox.com/oauth2/authorize',
        token: 'https://api.dropboxapi.com/oauth2/token',
        profileMethod: 'post',
        profile: async function (credentials, params, post) {

            credentials.profile = await post('https://api.dropboxapi.com/2/users/get_current_account');
        }
    };
};
