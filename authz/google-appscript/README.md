# Spreadsheet helper to manage permissions

1. Create a new Spreadsheet
    - Create this structure
    id	bucket	folder	role  rw/ro

1. Create a Google Apps Script into the Spreadsheet and paste [this code](index.gs.js)

1. In the manifest (appsscript.json) add the oauthScopes

        "oauthScopes": [
            "https://www.googleapis.com/auth/script.external_request", 
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/spreadsheets.currentonly"
        ]

1. Environment vars for this first script:

    * script_url: the url of the webapp from second script (next step)


1. Create a second Google Apps Script (standalone published as webapp) and create two files, with [this code](/standalone/) (one of the files is a version of [this library](https://script.google.com/a/macros/uoc.edu/library/versions/d/1Qx-smYQLJ2B6ae7Pncbf_8QdFaNm0f-br4pbDg0DXsJ9mZJPdFcIEkw_))

    * Env vars:

        * KEY: aws key
        * SECRET: aws secret
        * REGION: aws region
        * SpreadsheetID_#: id of the spreadsheet with permissions sheet. Create as many Spreadsheets as you need to isolate permissions.
        * bucket: destination folder
        * file: destination filename