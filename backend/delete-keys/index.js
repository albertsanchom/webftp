'use strict';

const utils = require('../utils');

const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3"); 

const client = new S3Client({'region' : process.env.AWS_REGION || 'eu-west-1'});

async function deleteFromS3(bucket, path) {

  const listParams = {
    Bucket: bucket,
    Prefix: path
  };

  let command = new ListObjectsV2Command(listParams);
  const listedObjects = await client.send(command);

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  command = new DeleteObjectsCommand(deleteParams);
  const deleteResult = await client.send(command);

  if (listedObjects.IsTruncated && deleteResult){
    await deleteFromS3(bucket, path);
  }
}

exports.handler = async (event, context) => {
  const check = utils.checkAuth(event, "delete");

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

  await Promise.all(keys.map(async(key) => {
      const newKey = utils.adaptKey(event, key, check.user);
      let testKey;
      if(newKey){
        if(newKey.indexOf("/")){
          testKey = newKey.slice(newKey.lastIndexOf("/")+1);
          testKey = testKey.indexOf(".")===-1 ? "/" : "";
        }
        await deleteFromS3(check.bucket, newKey+testKey);
      }
  }));

  return utils.getResponse(null, JSON.stringify({"message" : "done"}));
    
};