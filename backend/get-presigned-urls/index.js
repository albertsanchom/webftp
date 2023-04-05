'use strict';

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({'region' : process.env.AWS_REGION || 'eu-west-1'});

const utils = require('../utils');

exports.handler = async (event, context) => {
    const check = utils.checkAuth(event);

    if(check.error){
       return utils.getResponse(check.error, null, 401);
    }
    
    let keys = null;

    if (event.body !== null && event.body !== undefined) {
        let body = JSON.parse(event.body);
        if (body.keys){ 
            keys = body.keys;
        }
    }
    
    if(!keys) {
        return utils.getResponse("no keys", null, 400);
    }

    let urls = [];
    const signedUrlExpireSeconds = 60 * 5;
    
    let command, url;

    for(let key of keys) {
        let val = utils.adaptKey(event, key, check.user);        

        command = new GetObjectCommand({
            Bucket: check.bucket,
            Key: val
        });
        url = await getSignedUrl(client, command, { expiresIn: signedUrlExpireSeconds });

        urls.push(url);
    }
    
    var bodyContent = "{\"urls\":" + JSON.stringify(urls) + "}";
    
    return utils.getResponse(null, bodyContent);
};