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

	const testContent = function(str){
	
		return `
			<html>
				<body>
					<h1>${str}</h1>
					<a href="/public">Públic</a><br />
					<a href="/private">Private content</a><br />
					<a href="/profile">Perfil</a><br />
					<a href="/fetch">Test fetch profile</a><br />
					<a href="/setCFCookies">Set Cloudfront Cookies</a>
				</body>
			</html>
		`
	};

	app.get(config.api_path+'/', function(req, res, next){
		res.send(testContent("Hello world"));		
	});

	app.get(config.api_path+'/public', function(req, res, next){
		res.send(testContent("Public"));		
	});

	app.get(config.api_path+'/private', openid.requiresAuth(), async function(req, res, next){
		res.send(testContent("Private"));		
	});

	app.get(config.api_path+'/fetch', function(req, res, next){
		res.set("Content-Security-Policy", "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'")
		res.send(
			testContent("Fetch") +
			`
				<script>
					(async () => { 
						try{
							const response = await fetch("/profile");
							console.log("----> ", response.ok)
							if(response.ok){
								let json = await response.json();
								document.body.innerHTML = JSON.stringify(json);
							}else{
								alert("HTTP-Error: " + response.status);
							}
						}catch(e){
							window.location.replace("/auth?redirect=/fetch");
							return;
						}
					})();
				</script>
			`
		);		
	});


};