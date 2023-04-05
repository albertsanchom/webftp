'use strict';

const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
const { S3Client } = require("@aws-sdk/client-s3");

const utils = require('../utils');

const client = new S3Client({'region' : process.env.AWS_REGION || 'eu-west-1'});

exports.handler = async (event, context) => {

    const check = utils.checkAuth(event, "upload");

    if(check.error){
       return utils.getResponse(check.error, null, 401);
    }
    
    const expires = 3600;

    const params = {
        Bucket: check.bucket,
        Key: check.key,
        Conditions: [
     	   ["starts-with", "$key", check.key],
 	       {"bucket": check.bucket},
           ["starts-with", "\$Content-Type", ""],
        ],
        Expiration: expires
    };
    
    const { url, fields } = await createPresignedPost(client, params);    

    let formdata = {};
    formdata.endpoint = url;
    formdata.key = (check.key ? check.key + "/" : "") + '${filename}';
    for(let k in fields){
        formdata[k] = fields[k];
    }

    return utils.getResponse(null, JSON.stringify(formdata));
}