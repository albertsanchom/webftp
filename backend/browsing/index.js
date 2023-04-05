'use strict';

const utils = require('../utils');
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3"); 

const client = new S3Client({'region' : process.env.AWS_REGION || 'eu-west-1'});

exports.handler = async (event, context) => {
    const check = utils.checkAuth(event);

    let folderSearch = true;
    if(event.queryStringParameters && event.queryStringParameters.folderSearch && event.queryStringParameters.folderSearch==="false"){
      folderSearch = false;
    }

    if(check.error){
       return utils.getResponse(check.error, null, 401);
    }
    
    if(check.data){ //home
        return utils.getResponse(null, JSON.stringify(check.data));
    }

    let params = {
        Bucket: check.bucket,
        Delimiter: '/',
        Prefix: check.key ? check.key + (folderSearch ? "/" : "") : "",
        //MaxKeys: 100
    };

    if(event.queryStringParameters && event.queryStringParameters.continuationToken) {
        params.ContinuationToken = event.queryStringParameters.continuationToken;
    }

    const command = new ListObjectsV2Command(params);
    let data = await client.send(command);

    if(check.user){
        if(data && data.Contents && data.Contents.length){
            for(let i=0,z=data.Contents.length;i<z;i++){
                data.Contents[i].Key = utils.removeDoubleSlash(data.Contents[i].Key.replace(check.user+"/",""));
            }
        }
        if(data && data.CommonPrefixes && data.CommonPrefixes.length){
            for(let i=0,z=data.CommonPrefixes.length;i<z;i++){
                data.CommonPrefixes[i].Prefix = utils.removeDoubleSlash(data.CommonPrefixes[i].Prefix.replace(check.user+"/",""));
            }
        }
        if(!data){
            data = {};
        }
        data.Prefix = utils.removeDoubleSlash(data.Prefix.replace(check.user+"/",""));
        data.user = check.user;
        data.folders = check.folders;
    }
    
    data.access = check.access;

    return utils.getResponse(null, JSON.stringify(data));
};