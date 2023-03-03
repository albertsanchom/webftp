const scriptProperties = PropertiesService.getScriptProperties();

const key = scriptProperties.getProperty("KEY");
const secret = scriptProperties.getProperty("SECRET");
const bucket = scriptProperties.getProperty("bucket");
const region = scriptProperties.getProperty("REGION");
const permissionsFile = scriptProperties.getProperty("file");

function getCSVData(_sheet, index){
  const range = _sheet.getDataRange();
  const values = range.getValues();
  let rows = [];
  let row;

  for (var i = (index===0?0:1); i < values.length; i++) {
    row = "";
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j]) {
        row = row + values[i][j].trim();
      }
      if(j < values[i].length-1) { row = row + ","; }
    }
    rows.push(row);
  }
  return rows;
}

function s3uploadPermissions(){
  let SpreadsheetsID = [];

  const keys = scriptProperties.getKeys();

  for (let i=0, z=keys.length; i<z; i++) {
    if(keys[i].indexOf("SpreadsheetID_")>-1){
      SpreadsheetsID.push(scriptProperties.getProperty(keys[i]));
    }
  }
  
  let ss;
  let rows = [];
  const s3 = getInstance(key, secret, {'region':region});
  
  for(let i=0, z=SpreadsheetsID.length; i<z; i++){
    ss = SpreadsheetApp.openById(SpreadsheetsID[i]);
    rows = rows.concat(getCSVData(ss.getActiveSheet(), i));
  }
  
  try{
    const blob = Utilities.newBlob(rows.join("\n", "text/csv"));
    s3.putObject(bucket, permissionsFile, blob, {'logRequests':true, 'region':region});
    return true;
  }catch(e){
    return false;
  }
}

function doGet(e) {
  const output = s3uploadPermissions();
  return ContentService.createTextOutput(JSON.stringify({'done':output})).setMimeType(ContentService.MimeType.JSON); 
}
