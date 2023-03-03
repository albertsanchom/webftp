let sts = null;

exports.setCredentials = async (_AWS, role) => {

    if(!sts){
        sts = new _AWS.STS();
    }

    return new Promise((resolve, reject) => {
        sts.assumeRole({
            RoleArn: role,
            RoleSessionName: 'ftp-serverless'
        }).promise().then(function(data){
            _AWS.config.accessKeyId = data.Credentials.AccessKeyId;
            _AWS.config.secretAccessKey = data.Credentials.SecretAccessKey;
            _AWS.config.sessionToken = data.Credentials.SessionToken;
            resolve(data.Credentials);
        }).catch((err) => {
            console.log(err, err.stack);
            reject(err);
        });
    });
};

exports.getResponse = (err, data, status) => {

    let response = {
        "statusCode": status || 200,
        ...err && !data && {"body": `{"error":"${err}"}`},
        ...!err && data && {"body": `${data}`},
        "headers" : {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : process.env.ORIGIN || '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : '*',
            'Surrogate-Control': 'no-store',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };

    return response;
}

const getPath = (event) => {
    if(event.queryStringParameters && event.queryStringParameters.path) {
        return event.queryStringParameters.path;
    }else if (event.body !== null && event.body !== undefined) {
        let body = JSON.parse(event.body);
        if (body.keys){
            return body.keys[0];
        }
    }
    return "";
}

const getUser = (event) => {
    if(event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.user){
        return event.requestContext.authorizer.user;
    }
    return null;
}

const _trimSlash = (_str) => {
    if(_str){
        _str = _str.replace(/^\/+|\/+$/g, '');
    }
    return _str;
}

exports.trimSlash = _trimSlash;

const _removeDoubleSlash = (_str) => { 
    if(_str){
        _str = _str.replace(/\/+/g, '/');
    }
    return _str;
}

exports.removeDoubleSlash = _removeDoubleSlash;

const _getBestPermissionMatch = (permissions, requestedPath) => {
    
    let bestMatch = {'equals' : false, 'index' : -1};

    if(!permissions){
        return bestMatch;
    }
    
    for(let i=0,z=permissions.length;i<z;i++){
        //best match equals or contains?
        if(permissions[i].folder===requestedPath){
            bestMatch = {'equals' : true, 'index' : i};
            break;
        }else if((requestedPath+"/").indexOf(permissions[i].folder+"/")===0){
            if(bestMatch.index===-1 || permissions[i].folder.length>permissions[bestMatch.index].folder){// longest folder
                bestMatch = {'equals' : false, 'index' : i};
            }
        }else if(permissions[i].folder==="" && bestMatch.index===-1){
            bestMatch = {'equals' : false, 'index' : i};
        }
    }
    
    return bestMatch;
}

exports.checkAuth = function(event, action){

    let user = getUser(event);

    if(!user){
        return {"error" : "no user, no live"};
    }

    let path = getPath(event);

    let permissions = event.requestContext.authorizer.permissions; //{bucket : [{folder,role,access}]

    try{
        permissions = JSON.parse(permissions);
    }catch(e){
        return {"error" : "no permissions"};
    }

    let buckets = Object.keys(permissions);

    const originalPath = path;
    path = path.split("/");
    let requestedPath = path.slice(1).join("/");
    requestedPath = _removeDoubleSlash(_trimSlash(requestedPath));

    const bestMatch = _getBestPermissionMatch(permissions[path[0]], requestedPath);

    if(originalPath===''){ //return available buckets
        return {
            data : {
                CommonPrefixes : buckets.map(function(i){return {Prefix: i + "/"}}),
                Contents : [],
                Prefix : "",
                Name : ""
            }
        }
    }else if(buckets.indexOf(originalPath)>-1){ //bucket directly. It could be "admin" of that bucket... then

        if(bestMatch.index>-1 && permissions[originalPath][bestMatch.index].role=='admin'){
            return {
                "bucket" : originalPath,
                "key" : "",
                "user" : "",
                "access" : permissions[originalPath][bestMatch.index].access,
            }
        }else{
            return {
                data : { //emulates s3 api response
                    CommonPrefixes : permissions[path[0]].map(function(i){return i.folder ? {Prefix: i.folder + "/"} : {Prefix : ""}}),
                    Contents : [],
                    Prefix : "",
                    Name : path[0],
                    isRootForUser : true,
                    access : "ro"
                }
            }
        }
    }else{
        //path = path.split("/");
        //let requestedPath = path.slice(1).join("/");
        //requestedPath = _removeDoubleSlash(_trimSlash(requestedPath));
        let isAuth = false;
        if(!permissions[path[0]]){
            return {"error" : "wrong bucket"};
        }

        //const bestMatch = _getBestPermissionMatch(permissions[path[0]], requestedPath);

        if(bestMatch.index>-1){
            if(bestMatch.equals && permissions[path[0]][bestMatch.index].role==="user" && action==="delete"){
                isAuth = false;
            }else{
                isAuth = true;
                if(permissions[path[0]][bestMatch.index].role==="user"){
                    requestedPath = requestedPath.replace(permissions[path[0]][bestMatch.index].folder, permissions[path[0]][bestMatch.index].folder+"/"+user);
                }
                
                if((["delete","upload"].indexOf(action)>-1 && permissions[path[0]][bestMatch.index].access!=='rw')){
                    isAuth = false;
                }
            }
        }

        const access = permissions[path[0]][bestMatch.index].access;
        return {
            ...isAuth && {"bucket" : path[0]},
            ...isAuth && {"key" : requestedPath},
            ...isAuth && {"user" : permissions[path[0]][bestMatch.index].role==='admin' ? "" : user},
            ...isAuth && {"folders" : permissions[path[0]]},
            ...isAuth && {"access" : permissions[path[0]][bestMatch.index].access},
            ...!isAuth && {"error" : "not authorized key or user"}
        }
    }
}

exports.adaptKey = function(event, path, user){

    let permissions = event.requestContext.authorizer.permissions; //{bucket : [{folder,role,access}]

    try{
        permissions = JSON.parse(permissions);
    }catch(e){
        return {"error" : "no permissions"};
    }

    path = path ? path.split("/") : [];
    let requestedPath = path.slice(1).join("/");

    let isAuth = false;

    const bestMatch = _getBestPermissionMatch(permissions[path[0]], requestedPath);

    if(bestMatch.index>-1){
        isAuth = true;
        if(permissions[path[0]][bestMatch.index].role==="user"){
            requestedPath = requestedPath.replace(permissions[path[0]][bestMatch.index].folder, permissions[path[0]][bestMatch.index].folder+"/"+user);
        }
    }
    
    return !isAuth ? null : requestedPath;
}
