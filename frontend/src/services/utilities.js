const utilities = {};

utilities.install = function (app) {

  this.stage = null;

  app.config.globalProperties.$getStage = () => {
    if(this.stage){
      return this.stage;
    }
    const found = window.location.host.match(/(?:.*)\.(.*)\.(?:gencat.cat)/);
    this.stage = found ? found[1] : 'pro';
    return this.stage;
  }

  app.config.globalProperties.$trimSlash = (path) => {
    return path ? path.replace(/^\/+|\/+$/g, '') : path;
  }

  app.config.globalProperties.$cleanDoubleSlash = (path) => {
    return path ? path.replace(/\/\//g, '/') : path;
  }

  const _generateFormData = (formData, file, path, isFolder=false) => {
    let fd = new FormData();
    let filename = "";
    for(var k in formData){
      if(["endpoint"].indexOf(k)===-1){
        if(k==="key"){
          filename = formData[k].replace("${filename}",path+"${filename}"+((!isFolder && file.name.indexOf(".")===-1)?".xyz":"")); //adds extension .xyz if no extension
          fd.append(k, filename);
        }else{
          fd.append(k, formData[k]);
        }
      }
    }

    fd.append('Content-Type', file.type);
    fd.append('file', file);
    return fd;
  }

  app.config.globalProperties.$generateFormData = _generateFormData;

  app.config.globalProperties.$getRequest = async(url) => {
    url = url + "&ts=" + (+new Date);
    return new Promise((resolve, reject) => {
      fetch(url, {
          method: 'GET', 
          mode: 'cors', 
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            //'Authorization': window.localStorage.getItem("token")
          },
          redirect: 'follow',
      }).then( res => {
        switch(res.status){
          case 401:
            throw {"http_status" : res.status};
          case 500:
            throw {"http_status" : res.status}
        }
        if (!res.ok) { throw res }
        return res.json();
      })
      .then(json => {
        resolve(json);
      })
      .catch(err => {
        reject(err);
      })
    });
  }

  const _postRequest = async(url, data, auth=false) => {
    return new Promise((resolve, reject) => {
      fetch(url, {
          method: 'POST', 
          mode: 'cors', 
          credentials: 'omit',
          headers: {
          //'Content-Type': 'text/html',
          ...auth && {'Authorization': window.localStorage.getItem("token")}
          },
          redirect: 'follow',
          body: data,
      }).then( res => {
        switch(res.status){
          case 401:
            throw {"http_status" : res.status};
          case 500:
            throw {"http_status" : res.status}
        }
        if (!res.ok) { throw res }
        resolve(res);
      })
      .catch( err => {
        reject(err);
      })
    });
  }

  app.config.globalProperties.$postRequest = _postRequest;

  app.config.globalProperties.$downloadFile = async(url, name) => {
    const response = await fetch(url, {method: 'GET'});
    const blob = await response.blob();
    var href = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a); 
    a.click();  
    setTimeout(() => { window.URL.revokeObjectURL(href); }, 60000); 
    a.remove();
  }

  app.config.globalProperties.$traverseFileTree = async (item) => {
    return await getAllFileEntries(item);
  }

  async function getFile(entry){
    return new Promise((resolve) => {
      entry.file(function(file) {
        resolve({binary : file, name : entry.name, path : entry.fullPath})
      });
    });
  }

  app.config.globalProperties.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  app.config.globalProperties.strShortener = (str) => {
    const strlimit = 35;
    str = str.split("/").map(s => {
      s = s.split(".");
      for(let i=0;i<s.length;i++){
        if(s[i].length>strlimit){
          s[i] = s[i].slice(0,strlimit-3) + "...";
        }
      }
      return s.join(".");
    }).join("/");
    return str;
  }

  /*
    From stack overflow, great response to use readers in async/await mode 
    https://stackoverflow.com/questions/3590058/does-html5-allow-drag-drop-upload-of-folders-or-a-folder-tree/53058574#53058574
  */

  // Drop handler function to get all files
  async function getAllFileEntries(dataTransferItemList) {
    let fileEntries = [];
    // Use BFS to traverse entire directory/file structure
    let queue = [];
    // Unfortunately dataTransferItemList is not iterable i.e. no forEach
    for (let i = 0; i < dataTransferItemList.length; i++) {
      queue.push(dataTransferItemList[i].webkitGetAsEntry());
    }
    while (queue.length > 0) {
      let entry = queue.shift();
      if (entry.isFile) {
        const file = await getFile(entry);
        fileEntries.push(file);
      } else if (entry.isDirectory) {
        queue.push(...await readAllDirectoryEntries(entry.createReader()));
      }
    }
    return fileEntries;
  }

  // Get all the entries (files or sub-directories) in a directory 
  // by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(directoryReader) {
    let entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
      entries.push(...readEntries);
      readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  async function readEntriesPromise(directoryReader) {
    try {
      return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
      });
    } catch (err) {
      console.log(err);
    }
  }

}

export default utilities;
