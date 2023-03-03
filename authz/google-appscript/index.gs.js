/*
  Posar aquests scopes al manifest

   "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request", 
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.currentonly"
  ]
*/

const scriptProperties = PropertiesService.getScriptProperties();

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('WebFTP')
      .addItem('Sincronitzar permisos', "s3uploadPermissions")
      .addToUi();
}

function s3uploadPermissions(){
  const response = UrlFetchApp.fetch(scriptProperties.getProperty("script_url"), {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions : false
  });

  try{
    const output = JSON.parse(response.getContentText());
    if(output.done){
      Browser.msgBox("Permisos sincronitzats");
      return;
    }else{
    }
  }catch(e){
    Logger.log(e)
  }

  Browser.msgBox("S'ha produït un error");

}
