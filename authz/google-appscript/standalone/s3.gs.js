/* 
 * very basic AWS S3 Client library for Google Apps Script
 * @author Erik Schultink <erik@engetc.com>
 * includes create/delete buckets, create/read/delete objects. very limited support for any optional params.
 * 
 * @see http://engetc.com/projects/amazon-s3-api-binding-for-google-apps-script/
 */

/**
 * @license Copyright 2014-15 Eng Etc LLC - All Rights Reserved
 *
 * LICENSE (Modified BSD) - Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 *   1) Redistributions of source code must retain the above copyright notice, this list of conditions and 
 *      the following disclaimer.
 *   2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions 
 *      and the following disclaimer in the documentation and/or other materials provided with the 
 *      distribution.
 *   3) Neither the name of the Eng Etc LLC, S3-for-Google-Apps-Script, nor the names of its contributors may be used to endorse or 
 *      promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED 
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL ENG ETC LLC BE LIABLE FOR ANY DIRECT, INDIRECT, 
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR 
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF 
 * SUCH DAMAGE.
 */

//Body of the library


/* constructs an S3 service
 *
 * @constructor
 * @param {string} accessKeyId your AWS AccessKeyId
 * @param {string} secretAccessKey your AWS SecretAccessKey
 * @param {Object} options key-value object of options, unused
 *
 * @return {S3}
 */
function getInstance(accessKeyId, secretAccessKey, options) {
    return new S3(accessKeyId, secretAccessKey, options);
  }
  
  /* constructs an S3 service
   *
   * @constructor
   * @param {string} accessKeyId your AWS AccessKeyId
   * @param {string} secretAccessKey your AWS SecretAccessKey
   * @param {Object} options key-value object of options, unused
   */
  function S3(accessKeyId, secretAccessKey, options) {
    if (typeof accessKeyId !== 'string') throw "Must pass accessKeyId to S3 constructor";
    if (typeof secretAccessKey !== 'string') throw "Must pass secretAcessKey to S3 constructor";
    
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.options = options | {};
  }
  
  
  
  /* creates bucket in S3
   *
   * @param {string} bucket name of bucket
   * @param {Object} options optional parameters to create request; supports x-amz-acl
   * @throws {Object} AwsError on failure
   * @return void
   */
  S3.prototype.createBucket = function (bucket, options) {
    options = options || {}; 
    
    
    var request = new S3Request(this, this.options || options);
    request.setHttpMethod('PUT');
    
    //this is dumb and is optional from AWS perspective
    //but UrlFetchApp will default a Content-Type header to application/xml-www-form-url-encoded or whatever, which 
    //screws up the signature of the request
    request.setContentType('text/plain');
    
    //support setting of ACL
    if (typeof options["x-amz-acl"] == 'undefined') {
      options["x-amz-acl"] = "private";
    }
    request.addHeader("x-amz-acl", options["x-amz-acl"]);
    
    request.setBucket(bucket);
    
    request.execute(options);
    
  };
  
  /* deletes bucket from S3 
   *
   * @param {string} bucket name of bucket
   * @param {Object} options optional parameters to delete request
   * @throws {Object} AwsError on failure
   * @return void
   */
  S3.prototype.deleteBucket = function (bucket, options) {
    options = options || {};
  
    var request = new S3Request(this, this.options || options);
    request.setHttpMethod('DELETE');
    
    request.setBucket(bucket);
    request.execute(options);
  };
  
  /* puts an object into S3 bucket
   * 
   * @param {string} bucket 
   * @param {string} objectName name to uniquely identify object within bucket
   * @param {string} object byte sequence that is object's content
   * @param {Object} options optional parameters
   * @throws {Object} AwsError on failure
   * @return void
   */
  S3.prototype.putObject = function (bucket, objectName, object, options) {
    options = options || {};
  
    var request = new S3Request(this, this.options || options);
    request.setHttpMethod('PUT');
    request.setBucket(bucket);
    request.setObjectName(objectName);
    
    var failedBlobDuckTest = !(typeof object.copyBlob == 'function' &&
                        typeof object.getDataAsString == 'function' &&
                        typeof object.getContentType == 'function'
                        );
    
    //wrap object in a Blob if it doesn't appear to be one
    if (failedBlobDuckTest) {
      object = Utilities.newBlob(JSON.stringify(object), "application/json");
      object.setName(objectName);
    }
    
    request.setContent(object.getDataAsString());
    request.setContentType(object.getContentType());
    
    request.execute(options);  
  };
  
  /* gets object from S3 bucket
   *
   * @param {string} bucket name of bucket
   * @param {string} objectName name that uniquely identifies object within bucket
   * @param {Object} options optional parameters for get request (unused)
   * @throws {Object} AwsError on failure
   * @return {Blob|Object} data value, converted from JSON or as a Blob if it was something else; null if it doesn't exist
   */
  S3.prototype.getObject = function (bucket, objectName, options) {
    options = options || {};
    
    var request = new S3Request(this, this.options || options);
    request.setHttpMethod('GET');
    
    request.setBucket(bucket);
    request.setObjectName(objectName);
    try {
      var responseBlob = request.execute(options).getBlob();
    } catch (e) {
      if (e.name == "AwsError" && e.code == 'NoSuchKey') {
        return null;
      } else {
        //some other type of error, rethrow
        throw e; 
      }
    }
    
    //not sure this is better to put here, rather than in S3Request class
    if (responseBlob.getContentType() == "application/json") {
       return JSON.parse(responseBlob.getDataAsString());
    }
    return responseBlob;
  };
  
  /* deletes object from S3 bucket
   *
   * @param {string} bucket bucket name
   * @param {string} objectName name that uniquely identifies object within bucket
   * @param {Object} options optional parameters to delete request, unused
   * @throws {Object} AwsError on failure
   * @return void
   */
  S3.prototype.deleteObject = function (bucket, objectName, options) {
    options = options || {};  
    
    var request = new S3Request(this, this.options || options);
    request.setHttpMethod('DELETE');
    
    request.setBucket(bucket);
    request.setObjectName(objectName);
    
    request.execute(options);  
  };
  
  
  //for debugging
  S3.prototype.getLastExchangeLog = function() {
    return this.lastExchangeLog; 
  }
  
  /*
   * helper to format log entry about HTTP request/response
   * 
   * @param {Object} request object, from UrlFetchApp.getRequest()
   * @param {goog.HTTPResponse} response object, from UrlFetchApp
   */
  S3.prototype.logExchange_ = function(request, response) {
    var logContent = "";
    logContent += "\n-- REQUEST --\n";
    for (i in request) {
      if (typeof request[i] == 'string' && request[i].length > 1000) {
        //truncate to avoid making log unreadable
        request[i] = request[i].slice(0, 1000) + " ... [TRUNCATED]"; 
      }
      logContent += Utilities.formatString("\t%s: %s\n", i, request[i]);
    }
      
    logContent += "-- RESPONSE --\n";
    logContent += "HTTP Status Code: " + response.getResponseCode() + "\n";
    logContent += "Headers:\n";
    
    var headers = response.getHeaders();
    for (i in headers) {
      logContent += Utilities.formatString("\t%s: %s\n", i, headers[i]);
    }
    logContent += "Body:\n" + response.getContentText();
    this.lastExchangeLog = logContent;
  }
  
  /*
   * Most code of AWS Signature Version 4 is ported from the aws-sdk-js
   * https://github.com/aws/aws-sdk-js/blob/7cc9ae5b0d7b2935fa69dee945d5f3e6e638c660/lib/signers/v4.js
   * 
   */
  
  /* constructs an S3Request to an S3 service
   *
   * @constructor
   * @param {S3} service S3 service to which this request will be sent
   */
  function S3Request(service, options) {
    this.service = service;
  
    this.httpMethod = "GET";
    this.contentType = "";
    this.content = ""; //content of the HTTP request
    this.bucket = ""; //gets turned into host (bucketName.s3.amazonaws.com)
    this.objectName = "";
    this.headers = {};
  
    this.date = new Date();
    this.serviceName = 's3';
    this.region = options.region || 'us-east-1';
    this.expiresHeader = 'presigned-expires';
    this.extQueryString = '';
  }
  
  /* sets contenetType of the request
   * @param {string} contentType mime-type, based on RFC, indicated how content is encoded
   * @throws {string} message if invalid input
   * @return {S3Request} this request, for chaining
   */
  S3Request.prototype.setContentType = function (contentType) {
    if (typeof contentType != 'string') throw 'contentType must be passed as a string';
    this.contentType = contentType;
    return this;
  };
  
  S3Request.prototype.getContentType = function () {
    if (this.contentType) {
      return this.contentType;
    } else {
      //if no contentType has been explicitly set, default based on HTTP methods
      if (this.httpMethod == "PUT" || this.httpMethod == "POST") {
        //UrlFetchApp defaults to this for these HTTP methods
        return "application/x-www-form-urlencoded";
      }
    }
    return "";
  }
  
  
  /* sets content of request
   * @param {string} content request content encoded as a string
   * @throws {string} message if invalid input
   * @return {S3Request} this request, for chaining
   */
  S3Request.prototype.setContent = function(content) {
    if (typeof content != 'string') throw 'content must be passed as a string'
    this.content = content;
    return this;
  };
  
  /* sets Http method for request
   * @param {string} method http method for request
   * @throws {string} message if invalid input
   * @return {S3Request} this request, for chaining
   */
  S3Request.prototype.setHttpMethod = function(method) {
    if (typeof method != 'string') throw "http method must be string";
    this.httpMethod = method;
    return this;
  };
  
  /* sets bucket name for the request
   * @param {string} bucket name of bucket on which request operates
   * @throws {string} message if invalid input
   * @return {S3Request} this request, for chaining
   */
  S3Request.prototype.setBucket = function(bucket) {
    if (typeof bucket != 'string') throw "bucket name must be string";
    this.bucket = bucket;
    return this;
  };
  /* sets objectName (key) for request
   * @param {string} objectName name that uniquely identifies object within bucket
   * @throws {string} message if invalid input
   * @return {S3Request} this request, for chaining
   */
  S3Request.prototype.setObjectName = function(objectName) {
    if (typeof objectName != 'string') throw "objectName must be string";
    this.objectName = objectName;
    return this;
  };
  
  
  /* adds HTTP header to S3 request (see AWS S3 REST api documentation for possible values)
   *
   * @param {string} name Header name
   * @param {string} value Header value
   * @throws {string} message if invalid input
   * @return {S3Request} this object, for chaining
   */
  S3Request.prototype.addHeader = function(name, value) {
    if (typeof name != 'string') throw "header name must be string";
    if (typeof value != 'string') throw "header value must be string";
    this.headers[name] = encodeURIComponent(value);
    return this;
  };
  
  S3Request.prototype._getUrl = function() {
    return "https://" + this.bucket.toLowerCase() + ".s3." + this.region + ".amazonaws.com/" + this.objectName;
  };
  /* gets Url for S3 request
   * @return {string} url to which request will be sent
   */
  S3Request.prototype.getUrl = function() {
    return this._getUrl() + this.extQueryString;
  };
  /* executes the S3 request and returns HttpResponse
   *
   * Supported options:
   *   logRequests - log requests (and responses) will be logged to Apps Script's Logger. default false.
   *   echoRequestToUrl - also send the request to this URL (useful for debugging Apps Script weirdness)
   *
   * @param {Object} options object with properties corresponding to option values; see documentation
   * @throws {Object} AwsError on failure
   * @returns {goog.UrlFetchApp.HttpResponse}
   */
  S3Request.prototype.execute = function(options) {
    options = options || {};
    for (var key in options) {
      var lowerKey = key.toLowerCase()
      if (lowerKey.indexOf('x-amz-') === 0) {
        this.addHeader(key, options[key])
      }
    }
  
    delete this.headers['Authorization'];
    delete this.headers['Date'];
    delete this.headers['X-Amz-Date'];
    this.headers['X-Amz-Content-Sha256'] = this.hexEncodedBodyHash();
    this.headers['Host'] = this._getUrl().replace(/https?:\/\/(.+amazonaws\.com).*/, '$1');
  
    var credentials = {
      accessKeyId: this.service.accessKeyId,
      secretAccessKey: this.service.secretAccessKey,
      sessionToken: options.sessionToken
    }
  
    this.addAuthorization(credentials, this.date)
    // To avoid conflict with UrlFetchApp#fetch. UrlFetchApp#fetch adds a Host header.
    delete this.headers['Host']
  
    var params = {
      method: this.httpMethod,
      payload: this.content,
      headers: this.headers,
      muteHttpExceptions: true //get error content in the response
    }
  
    //only add a ContentType header if non-empty (although should be OK either way)
    if (this.getContentType()) {
      params.contentType = this.getContentType();
    }
  
    var response = UrlFetchApp.fetch(this.getUrl(), params);
  
    //debugging stuff
    var request = UrlFetchApp.getRequest(this.getUrl(), params);
  
    //Log request and response
    this.lastExchangeLog = this.service.logExchange_(request, response);
    if (options.logRequests) {
      Logger.log(this.service.getLastExchangeLog());
    }
  
    //used in case you want to peak at the actual raw HTTP request coming out of Google's UrlFetchApp infrastructure
    if (options.echoRequestToUrl) {
      UrlFetchApp.fetch(options.echoRequestToUrl, params);
    }
  
    //check for error codes (AWS uses variants of 200s for flavors of success)
    if (response.getResponseCode() > 299) {
      //convert XML error response from AWS into JS object, and give it a name
      var error = {};
      error.name = "AwsError";
      try {
        var errorXmlElements = XmlService.parse(response.getContentText()).getRootElement().getChildren();
        for (i in errorXmlElements) {
          var name = errorXmlElements[i].getName();
          name = name.charAt(0).toLowerCase() + name.slice(1);
          error[name] = errorXmlElements[i].getText();
        }
        error.toString = function() { return "AWS Error - "+this.code+": "+this.message; };
        error.httpRequestLog = this.service.getLastExchangeLog();
      } catch (e) {
        //error parsing XML error response from AWS (will obscure actual error)
        error.message = "AWS returned HTTP code " + response.getResponseCode() + ", but error content could not be parsed."
        error.toString = function () { return this.message; };
        error.httpRequestLog = this.service.getLastExchangeLog();
      }
      throw error;
    }
  
    return response;
  };
  
  S3Request.prototype.addAuthorization = function(credentials, date) {
    var datetime = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    if (this.isPresigned()) {
      this.updateForPresigned(credentials, datetime);
    } else {
      this.addHeaders(credentials, datetime);
    }
    this.headers['Authorization'] = this.authorization(credentials, datetime)
  }
  
  S3Request.prototype.addHeaders = function (credentials, datetime) {
    this.headers['X-Amz-Date'] = datetime;
    if (credentials.sessionToken) {
      this.headers['x-amz-security-token'] = credentials.sessionToken;
    }
  }
  
  S3Request.prototype.updateForPresigned = function(credentials, datetime) {
    var credString = this.credentialString(datetime);
    var qs = {
      'X-Amz-Date': datetime,
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credentials.accessKeyId + '/' + credString,
      'X-Amz-Expires': this.headers[this.expiresHeader],
      'X-Amz-SignedHeaders': this.signedHeaders()
    };
  
    if (credentials.sessionToken) {
      qs['X-Amz-Security-Token'] = credentials.sessionToken;
    }
  
    if (this.headers['Content-Type']) {
      qs['Content-Type'] = this.headers['Content-Type'];
    }
    if (this.headers['Content-MD5']) {
      qs['Content-MD5'] = this.headers['Content-MD5'];
    }
    if (this.headers['Cache-Control']) {
      qs['Cache-Control'] = this.headers['Cache-Control'];
    }
  
    for (var key in this.headers) {
      if (key === this.expiresHeader) continue;
      if (this.isSignableHeader(key)) {
        var lowerKey = key.toLowerCase();
        // Metadata should be normalized
        if (lowerKey.indexOf('x-amz-meta-') === 0) {
          qs[lowerKey] = this.headers[key];
        } else if (lowerKey.indexOf('x-amz-') === 0) {
          qs[key] = this.headers[key];
        }
      }
    }
  
    var sep = this._getUrl().indexOf('?') >= 0 ? '&' : '?';
    var queryParamsToString = function(params) {
      var items = [];
      for (var key in params) {
        var value = params[key];
        var ename = encodeURIComponent(key);
        if (Array.isArray(value)) {
          var vals = [];
          for(var i in value) { vals.push(encodeURIComponent(value[i])) }
          items.push(ename + '=' + vals.sort().join('&' + ename + '='))
        } else {
          items.push(ename + '=' + encodeURIComponent(value))
        }
      }
      return items.sort().join('&')
    }
    this.extQueryString += sep + queryParamsToString(qs);
  }
  
  S3Request.prototype.authorization = function(credentials, datetime) {
    var parts = [];
    var credString = this.credentialString(datetime);
    parts.push('AWS4-HMAC-SHA256 Credential=' + credentials.accessKeyId + '/' + credString);
    parts.push('SignedHeaders=' + this.signedHeaders());
    parts.push('Signature=' + this.signature(credentials, datetime));
    return parts.join(', ');
  }
  
  S3Request.prototype.signature = function(credentials, datetime) {
    var sigingKey = this.getSignatureKey(
      credentials.secretAccessKey,
      datetime.substr(0, 8),
      this.region,
      this.serviceName
    )
    var signature = Utilities.computeHmacSha256Signature(Utilities.newBlob(this.stringToSign(datetime)).getBytes(), sigingKey)
    return this.hex(signature)
  }
  
  S3Request.prototype.hex = function(values) {
    return values.reduce(function(str, chr){
      chr = (chr < 0 ? chr + 256 : chr).toString(16);
      return str + (chr.length == 1 ? '0' : '') + chr;
    }, '');
  }
  
  S3Request.prototype.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
    var kDate = Utilities.computeHmacSha256Signature(dateStamp, "AWS4" + key);
    var kRegion = Utilities.computeHmacSha256Signature(Utilities.newBlob(regionName).getBytes(), kDate);
    var kService = Utilities.computeHmacSha256Signature(Utilities.newBlob(serviceName).getBytes(), kRegion);
    var kSigning = Utilities.computeHmacSha256Signature(Utilities.newBlob("aws4_request").getBytes(), kService);
    return kSigning;
  }
  
  S3Request.prototype.stringToSign = function(datetime) {
    var parts = [];
    parts.push('AWS4-HMAC-SHA256');
    parts.push(datetime);
    parts.push(this.credentialString(datetime));
    parts.push(this.hexEncodedHash(this.canonicalString()));
    return parts.join('\n');
  }
  
  S3Request.prototype.canonicalString = function() {
    var parts = [];
    var [base, search] = this.getUrl().split("?", 2)
    parts.push(this.httpMethod);
    parts.push(this.canonicalUri(base));
    parts.push(this.canonicalQueryString(search));
    parts.push(this.canonicalHeaders() + '\n');
    parts.push(this.signedHeaders());
    parts.push(this.hexEncodedBodyHash());
    return parts.join('\n');
  }
  
  S3Request.prototype.canonicalUri = function(uri) {
    var m = uri.match(/https?:\/\/(.+)\.s3.*\.amazonaws\.com\/(.+)$/);
    var object = m ? m[2] : ""
    return "/" + encodeURIComponent(object).replace(/%2F/ig, '/')
  }
  
  S3Request.prototype.canonicalQueryString = function(values) {
    if (!values) return ""
    var parts = [];
    var items = values.split("&");
    for (var i in items) {
      var [key, value] = items[i].split("=")
      parts.push(encodeURIComponent(key.toLowerCase()) + "=" + encodeURIComponent(value))
    }
    return parts.sort().join("&")
  }
  
  S3Request.prototype.canonicalHeaders = function() {
    var parts = [];
    for (var item in this.headers) {
      var key = item.toLowerCase();
      if (this.isSignableHeader(key)) {
        var header = key + ":" + this.canonicalHeaderValues(this.headers[item].toString())
        parts.push(header)
      }
    }
    return parts.sort().join("\n")
  }
  
  S3Request.prototype.canonicalHeaderValues = function(values) {
    return values.replace(/\s+/g, " ").trim();
  }
  
  S3Request.prototype.signedHeaders = function() {
    var keys = [];
    for (var key in this.headers) {
      key = key.toLowerCase();
      if (this.isSignableHeader(key)) {
        keys.push(key);
      }
    }
    return keys.sort().join(';');
  }
  
  S3Request.prototype.credentialString = function(datetime) {
    return [
      datetime.substr(0, 8),
      this.region,
      this.serviceName,
      'aws4_request'
    ].join('/');
  }
  
  S3Request.prototype.hexEncodedHash = function(string) {
    return this.hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, string, Utilities.Charset.UTF_8));
  }
  
  S3Request.prototype.hexEncodedBodyHash = function() {
    if (this.isPresigned() && !this.content.length) {
      return 'UNSIGNED-PAYLOAD'
    } else if (this.headers['X-Amz-Content-Sha256']) {
      return this.headers['X-Amz-Content-Sha256']
    } else {
      return this.hexEncodedHash(this.content || '')
    }
  }
  
  S3Request.prototype.isSignableHeader = function(key) {
    var lowerKey = key.toLowerCase()
    if (lowerKey.indexOf('x-amz-') === 0) return true;
    var unsignableHeaders = [
      'authorization',
      'content-type',
      'content-length',
      'user-agent',
      this.expiresHeader,
      'expect',
      'x-amzn-trace-id'
    ];
    return unsignableHeaders.indexOf(lowerKey) < 0
  }
  
  S3Request.prototype.isPresigned = function() {
    return this.headers[this.expiresHeader] ? true : false;
  }
  