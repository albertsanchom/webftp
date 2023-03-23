const { getSignedCookies } = require("@aws-sdk/cloudfront-signer");
const util = require("util");

//Private Key
let pk = process.env.AWS_PRIVATEKEY;
if(pk){
	pk = pk.split("-----")
	if(pk[2]){
		pk[2] = pk[2].split(" ").join("\n")
	}
	pk = pk.join("-----") + "\n"	
}

//Cookie TTL
let cookie_ttl = process.env.AWS_SIGNEDCOOKIES_TTL;
cookie_ttl = !isNaN(cookie_ttl) ? cookie_ttl*1 : 900; //default 15min

exports.sign = async function(){

    let hash;
    let expires = Math.ceil((new Date().getTime()/1000) + cookie_ttl);
    try{

		hash = getSignedCookies({
			"url" : "/",
			"keyPairId" : process.env.AWS_KEYPAIRID,
			"privateKey" : pk,
			'policy' : JSON.stringify({"Statement":[{"Resource": "*","Condition":{"DateLessThan":{"AWS:EpochTime":expires}}}]})
		});

	}catch(e){
        console.log(e.message)
	}
	
    return {'hash' : hash, 'expires' : expires};

};
