module.exports = function(){
	let stage = "";
	if(process.env.STAGE){
		stage = "/"+ process.env.STAGE;
	}
	
	return {
		'debug' : (process.env.DEBUG==='true' ? true : false),
		'issuer' : process.env.ISSUER || 'https://accounts.google.com',
		'baseURL' : process.env.BASEURL,
		'clientID' : process.env.OID_CLIENTID,
		'clientSecret' : process.env.OID_CLIENTSECRET,
		'redirectURIPath' : process.env.OID_REDIRECTURI_PATH,
		'stage' : stage,
		'port' : process.env.PORT || 3000,
		'cookies_secret' : process.env.COOKIES_SECRET || Math.random().toString(36).substring(2, 15),
		'cookies_ttl' : process.env.COOKIES_TTL || 86400,
		'api_path' : process.env.API_PATH || "",
		'google' : {
			'issuer' : process.env.G_ISSUER || 'https://accounts.google.com',
			'clientID' : process.env.G_OID_CLIENTID || null,
			'clientSecret' : process.env.G_OID_CLIENTSECRET || null,
			'redirectURIPath' : process.env.G_OID_REDIRECTURI_PATH || null,
		}
	}
};