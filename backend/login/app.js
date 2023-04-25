const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const session = require('express-session');
const config = require('./lib/config')();

/*if(!config){
  return "can't start server";
}*/

var app = express();

if(config && config.debug){
	console.info(config);
}

// Express setup
app.set('port', config ? config.port : 3000);

//Mandatory env vars
if(!config.baseURL || !config.clientID || !config.clientSecret || !config.redirectURIPath){
  console.log("Mandatory environment variables: \nBASEURL \nOID_CLIENTID \nOID_REDIRECTURI_PATH \nOID_CLIENTSECRET");
  process.exit();
}

if(config){
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(session(
    {
      resave: false,
      saveUninitialized: true,
      secret: config.cookies_secret,
      cookie : { httpOnly: true, maxAge: 10} // configure when sessions expires
  }));
  app.use(helmet());

  app.use(function (req, res, next) {
    res.removeHeader('Server');
    next();
  });

  //referer
  app.use(function(req, res, next){
    let referer = req.headers.referer;
    if(req.apiGateway && req.apiGateway.event && req.apiGateway.event.headers && req.apiGateway.event.headers.referer){
      referer = req.apiGateway.event.headers.referer.replace(/^http(s?):\/\//, "");
    }
    
    if(!referer){
      return next();
    }

    const io = referer.indexOf("/");
    if(io>-1){
      referer = referer.slice(io+2);
      if(referer.indexOf("/")>-1){
        referer = referer.slice(0,referer.indexOf("/"));
      }
    }

    req.query.referer = referer;
    next();
  });

  //nocache
  app.use(function (req, res, next) {
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.removeHeader('Server');
    next();
  });

  app.disable('x-powered-by');

  //Initializes openid
  const openid = require('./lib/oidc')(app, config);

  //Common routing stuff
  require('./lib/routes')(app, openid, config);
}

const isInLambda = !!process.env.LAMBDA_TASK_ROOT;

if(isInLambda){
  const awsServerlessExpress = require('aws-serverless-express');
  const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

  app.use(awsServerlessExpressMiddleware.eventContext());

  const server = awsServerlessExpress.createServer(app)
  exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
  
}else{
  app.listen(app.get('port'), function () {
    console.info('Server on port ' + app.get('port'));
  });
}