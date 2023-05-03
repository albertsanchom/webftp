const jose = require('jose')
const s3select = require("./s3select");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({'region' : process.env.REGION || 'eu-west-1'});

const _BUCKET = process.env.BUCKET || "";
const _FILE = process.env.FILE || "";
const _GOOGLE_x509_KEY = "googlex509.txt"

let google_cert = null;

async function getGoogle509fromS3(){
  const command = new GetObjectCommand({
    Bucket: _BUCKET,
    Key: _GOOGLE_x509_KEY
  });

  try {
    const response = await client.send(command);
    const str = await response.Body.transformToString();
    return str;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function putGoogle509toS3(x509){
  const input = { 
    ACL: "private",
    Body: x509,
    Bucket: _BUCKET, 
    Key: _GOOGLE_x509_KEY
  };

  try {
    const command = new PutObjectCommand(input);
    return await client.send(command);
  }catch(err) {
    console.error(err);
    return null;
  }
}

async function getGoogleCert(certKey){
  try{
    const response = await fetch('https://www.googleapis.com/oauth2/v1/certs');
    const json = await response.json();
    putGoogle509toS3(json[certKey]);
    return json[certKey];
  }catch(e){
    console.error(e.message);
    return null;
  }
}

async function getTokenPayload(publicCert, issuer, clientID, token){
  const alg = 'RS256'
  let x509 = publicCert;
  const publicKey = await jose.importX509(x509, alg)

  try{
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: issuer,
      audience: clientID,
    })
    return {'email' : payload.email, 'error' : null};
  }catch(e){
    console.error(e.message);
    return {'error' : e.message}; // Return a 401 Unauthorized response
  }
}

function getCookieValue(str, strCookie){
  const name = str + "=";
  const decodedCookies = decodeURIComponent(strCookie);
  const arrayCookies = decodedCookies.split('; ');
  let res = null;
  
  arrayCookies.forEach(val => {
    if (val.indexOf(name)===0){
      res = val.substring(name.length);
    }
  })
  return res;
}

const buildIAMPolicy = (userId, effect, resource, context) => {
    const policy = {
      principalId: userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
          },
        ],
      },
      context,
    };
  
    return policy;
};

async function getPermissions(user){
  if(!_BUCKET || !_FILE){
    return [];
  }

  const permissions = JSON.parse(await s3select.query({
    "Bucket" : _BUCKET, 
    "Key": _FILE, 
    "Expression": `select * from s3object s where s.id='${user}'`,
  }));
  
  let _auth = {};
  for(let i=0,z=permissions.length;i<z;i++){
    if(!_auth[permissions[i][1]]){
      _auth[permissions[i][1]] = [];
    }
    _auth[permissions[i][1]].push({folder:permissions[i][2], role: (permissions[i][3] || 'admin'), 'access' : (permissions[i][4] || 'rw')});
  }
  return _auth;
}
  
/**
  * Authorizer functions are executed before your actual functions.
  * @method authorize
  * @param {String} event.authorizationToken - JWT
  * @throws Returns 401 if the token is invalid or has expired.
  * @throws Returns 403 if the token does not have sufficient permissions.
  */
module.exports.handler = async (event, context, callback) => {
  //const token = event.authorizationToken;
  const token = getCookieValue("oidc_token", event.headers.Cookie);
  
  if(!token){
    return ('Unauthorized ', 'No token'); // Return a 401 Unauthorized response
  }

  try{
    let user = null;

    user = await getTokenPayload(process.env.OID_PUBLIC_x509, process.env.ISSUER, process.env.OID_CLIENTID, token);

    if(user.error!==null){
      //user = await getTokenPayload(process.env.G_OID_PUBLIC_x509, process.env.G_ISSUER, process.env.G_OID_CLIENTID, token);

      const jwt_headers = await jose.decodeProtectedHeader(token);
      google_cert = google_cert || await getGoogle509fromS3() || await getGoogleCert(jwt_headers.kid);

      if(google_cert!==null){
        user = await getTokenPayload(google_cert, process.env.G_ISSUER, process.env.G_OID_CLIENTID, token);
        if(user.error!==null){
          google_cert = await getGoogleCert(jwt_headers.kid);
          if(google_cert!==null){
            user = await getTokenPayload(google_cert, process.env.G_ISSUER, process.env.G_OID_CLIENTID, token);
          }
        }
      }    
    }

    if(user.error!==null){
      return ('Unauthorized ', user.error); // Return a 401 Unauthorized response
    }

    const permissions = await getPermissions(user.email);
    const effect = Object.keys(permissions).length>0 ? "Allow" : "Deny";
    const authorizerContext = { "user": user.email, "permissions" : JSON.stringify(permissions)};
    const policyDocument = buildIAMPolicy(user.email, effect, event.methodArn, authorizerContext);

    return (null, policyDocument); 
  }catch(e) {
    console.error(e.message);
    return ('Unauthorized ', e.message); // Return a 401 Unauthorized response
  }
};
