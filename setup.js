const fs = require('fs');
const os = require('os');

function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout? stdout : stderr);
    });
  });
}



async function main(){
  const _homedir = os.homedir();
  const _stage = process.env.STAGE;
  const _setupFile = _homedir+'/.config/sls/webftp.'+_stage+'.json';
  //const _frontendEndpointFolder = './frontend/src/assets/js/';
  const _spMetadataFolder = './docs/';
  const _authzPermissionsFolder = './authz/';
  let setup = fs.readFileSync(_setupFile, 'utf8');

  if(setup){
    try{
      setup = JSON.parse(setup)
    }catch(e){
      setup = null;
      console.error("Error processing file ", _setupFile);
    }

    if(!setup){
      return;
    }

    const serviceName = "webftp";
    const authzBucket = serviceName+"-authz-"+_stage;
    const apiPath = setup.API_PATH;
    const domain = setup.DOMAIN;

    //endpoint.js
    /*let sampleEndpoint = fs.readFileSync(_frontendEndpointFolder+"sample-endpoint.js", 'utf8');
    sampleEndpoint = sampleEndpoint.replace("{domain}",domain).replace("{api_path}",apiPath);
    fs.writeFileSync(_frontendEndpointFolder+"endpoint.js",sampleEndpoint);
    console.log(_frontendEndpointFolder+"endpoint.js successfully generated");*/

    //permissions.csv
    let sampleDataPermissions = fs.readFileSync(_authzPermissionsFolder+"sample-permissions.csv", 'utf8');
    sampleDataPermissions = sampleDataPermissions.replace(/{authzBucket}/g,authzBucket);
    fs.writeFileSync(_dataPermissionsFolder+"permissions.csv",sampleDataPermissions);
    console.log(_dataPermissionsFolder+"permissions.csv successfully generated");

    //sp-metadata.xml
    let metadataFile = fs.readFileSync(_spMetadataFolder+"sample-sp-metadata.xml", 'utf8');
    metadataFile = metadataFile.replace("{domain}",domain).replace("{api_path}",apiPath).replace("{issuer}",serviceName).replace("{stage}",_stage);
    fs.writeFileSync(_spMetadataFolder+"sp-metadata.xml",metadataFile);
    if((await execShellCommand("curl -F userfile=@docs/sp-metadata.xml https://samltest.id/upload.php")).indexOf("successfully")>-1){
      console.log(_spMetadataFolder+"sp-metadata.xml uploaded successfully to samltest.id");
    }
  }
}

main();
