//const jwt = require('jsonwebtoken');
const cfcookies = require('./utils/cookie-signer');

module.exports = function (app, openid, config) {

	app.get(config.api_path+"/setCFCookies*", openid.requiresAuth(), async function(req, res, next){
		const cookies = await cfcookies.sign();
		const hash = cookies.hash;

		const authorized = true;

		if(authorized){
			for(var k in hash){
				res.cookie(k, hash[k], {'path': '/', 'httpOnly': true, 'secure': true, 'sameSite': 'strict', 'maxAge': cookies.expires});
			}
		}else{
			res.clearCookie("connect.sid");
		}

		const redirect = req.query.redirect?req.query.redirect:'/';
		res.redirect(redirect);
	});

};