const { auth, requiresAuth } = require('express-openid-connect');

module.exports = function (app, config){

	app.use(
		auth({
			authRequired : false,
			issuerBaseURL: config.issuer || 'https://accounts.google.com',
			baseURL: config.baseURL,
			clientID: config.clientID,
			clientSecret: config.clientSecret,
			secret: config.cookies_secret,
			idpLogout: true,
			routes : {
				callback: config.api_path + config.redirectURIPath
			},
			authorizationParams: {
				response_type: 'code',
				scope: config.scopes || 'openid profile email',
				redirect_uri: config.baseURL + config.api_path + config.redirectURIPath,
				prompt : 'login'
			},
            session : {
                rolling: true,
                rollingDuration: config.cookies_ttl,
                absoluteDuration: config.cookies_ttl,
            },       
			afterCallback: (req, res, session) => {
				res.cookie('token', session.id_token, {'path': '/', 'httpOnly': true, 'secure': true, 'sameSite': 'strict', 'maxAge': config.cookies_ttl*1000});
				res.cookie('campusJWT', session.id_token, {'path': '/', 'httpOnly': false, 'secure': true, 'sameSite': 'strict', 'maxAge': config.cookies_ttl*1000});
				return session;
			},				   
		})
	);

	//error handling in callback
	app.use((err, req, res, next) => {
		if(req.path===(config.api_path + config.redirectURIPath)){ //redirectURIPath = callback url
		  console.log(err);
		}else{
			res.status(500).send('Error!');
		}
	});	

	//profile
	app.get(config.api_path+'/profile', requiresAuth(), async function(req, res){
		if(req.oidc && req.oidc.user){
			res.jsonp(req.oidc.user);
		}else{
			res.status(403).send("forbidden");
		}
	});

	app.get(config.api_path+'/auth', requiresAuth(), async function(req, res){
		const redirect = req.query.redirect?req.query.redirect:'/';
		res.redirect(redirect);
	});

	app.get(config.api_path+'/getId', requiresAuth(), async function(req, res){
		const redirect = req.query.redirect?req.query.redirect:'/';
		res.redirect(`${redirect}?token=${req.oidc.idToken}`);
	});

	app.get(config.api_path+'/getAccess', requiresAuth(), async function(req, res){
		let { access_token } = req.oidc.accessToken;
		const redirect = req.query.redirect?req.query.redirect:'/';
		res.redirect(`${redirect}?token=${access_token}`);
	});

    return {
        'requiresAuth' : requiresAuth
    };

}
