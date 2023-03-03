<template>
  <div id="app">

    <Header v-bind:isLogged="isLogged"
    />

    <div id="container">
      <Messages v-bind:loading="loading"
                v-bind:message="message"
                v-bind:isLogged="isLogged"
      />

      <Login @logged="setLogged"
            @browse="browseControler"
            v-bind:isLogged="isLogged"
      />

      <Controls @action="actionControler"
                v-bind:isRoot="isRoot"
                v-bind:isRootForUser="isRootForUser"
                v-bind:userName="userName"
                v-bind:isLogged="isLogged"
                v-bind:authError="authError"
                v-bind:readWrite="readWrite"
      />

      <Browser @browse="browseControler"
              v-bind:s3data="s3data"
              v-bind:currentDir="currentDir"
              v-bind:isRoot="isRoot"
              v-bind:loading="loading"
              v-bind:isRootForUser="isRootForUser"
              v-bind:isLogged="isLogged"
              v-bind:config="config"
              v-bind:authError="authError"
              v-bind:fetchError="fetchError"
              v-bind:folderSearch="folderSearch"
      />

      <Upload @action="actionControler"
              v-bind:isRoot="isRoot"
              v-bind:uploadMsg="uploadMsg"
              v-bind:isLogged="isLogged"
              v-bind:isRootForUser="isRootForUser"
              v-bind:authError="authError"
              v-bind:readWrite="readWrite"
      />

      <Log v-bind:log="log"
          v-bind:updates="updates"
          v-bind:isRoot="isRoot"
          v-bind:isLogged="isLogged"
      />

    </div>
  </div>
</template>

<style>
  body {
    margin: 0;
    padding: 0;
  }
  #container {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin: 1em auto;
    max-width: 60%;
  }

  #container div{
      display: block;
      /*margin: auto;*/
      padding: 1em;
  }

  #container #browser a{
      position: relative;
      text-decoration: none;
      color: blue;
  }

  #container #browser a:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: blue;
    visibility: hidden;
    transform: scaleX(0);
    transition: all 0.3s ease-in-out;
  }

  #container #browser a:hover:before {
    visibility: visible;
    transform: scaleX(1);
  }

  @media (max-width: 600px) {
    #container{
      width: 99%;
      max-width: 99%;
      display: block;
      margin: 1em 0em;
      padding: 0;
    }
    body{
      font-size: 1.2em;
    }
    #container div{
      padding: 0;
    }
  }
</style>

<script>
  import Header from './components/Header.vue'
  import Login from './components/Login.vue'
  import Controls from './components/Controls.vue'
  import Browser from './components/Browser.vue'
  import Upload from './components/Upload.vue'
  import Messages from './components/Messages.vue'
  import Log from './components/Log.vue'
  import endpoint from '@/assets/js/endpoint.js'

  export default {
    name: 'App',
    data() {
      this.$i18n.locale = navigator.language.slice(0,2);
      this.messages = this.$i18n.messages[this.$i18n.locale];
      return {
        s3data : {},
        currentDir : "",
        loading : false,
        message : "",
        uploadMsg : "",
        isRoot : true,
        isRootForUser : true,
        config : {},
        log : [],
        isLogged : false,
        readWrite : 'rw',
        updates : {},
        userName : "",
        authError : false,
        fetchError : false,
        folderSearch : true
      }
    },
    components: {
      Header,
      Login,
      Controls,
      Browser,
      Upload,
      Messages,
      Log
    },
    async created() {
      document.title = "WebFTP UOC";
      this.config = await this.$getRequest(endpoint.get() + "getconfig/?");
    },
    async beforeMount(){
      this.stage = this.$getStage();
      this.currentDir = decodeURI(window.location.pathname).replace(/^\//,'').replace(/^campus/, 'webftp-protected-files-'+this.stage).replace(/^public/,'webftp-files-'+this.stage);              
    },
    methods : {
      checkIfRoot() {
          this.isRoot = this.currentDir==="" ? true : false;
      },
      setLogged(data) {
        this.userName = data.name || null;
        this.isLogged = data.isLogged;
        if(!this.isLogged){
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("token_ttl");
          window.localStorage.removeItem("token_name");
          window.localStorage.removeItem("token_email");
        }
      },
      isValidToken() {
        if(!window.localStorage.getItem("token") || (((+new Date()/1000)+60)>window.localStorage.getItem("token_ttl"))){
          return false;
        }
        return true;
      },
      async actionControler(action, data) {
        this.loading = true;
        if(!this.isValidToken()){
          this.setLogged({isLogged:false, name: null});
          this.loading = false;
        }
        //action to do
        switch(action){
          case "browse": {
            this.browseControler(data, 'forward');
            break;
          }
          case "create": {
            var folder = prompt(this.messages.folder, "folder");
            if(folder){
              this.log.push({"name": folder, "path": this.currentDir.split("/").slice(1).join("/"), "creating" : true, "randomKey" : +new Date});
              let signedForm;
              try{
                signedForm = await this.$getRequest(endpoint.get() + "getuploadform?path="+encodeURIComponent(this.currentDir)+"/");
              }catch(e){
                console.log("maybe unauthorized");
                this.setLogged({isLogged:false, name: null});
                this.loading = false;
                return;
              }                 
              const formData = this.$generateFormData(signedForm, new File([""], "",{type: "text/directory",}), folder+"/", true);
              await this.$postRequest(signedForm.endpoint, formData);
              this.updates = {"name": folder, "action" : "created"};
              this.browseControler(this.currentDir, 'default');
            }
            this.loading = false;
            break;
          }

          case "delete": {
            let keys = [];
            let logs = this.log;
            const els = document.querySelectorAll("input[type=checkbox]:checked.ftps3-action-selectable");

            if(els.length>0 && window.confirm(this.messages.sure)){
              Array.prototype.forEach.call(els, function (item) {
                if(item.id==="selectAll"){return;}
                keys.push(item.value);
                logs.push({"name": item.value, "deleting" : true, "randomKey" : +new Date});
                item.checked="";
              });
              let response;
              try{
                response = await this.$postRequest(endpoint.get() + "deletekeys", JSON.stringify({"keys" : keys}), true);
              }catch(e){
                console.log("maybe unauthorized");
                this.setLogged({isLogged:false, name: null});
                this.loading = false;
                return;
              }              
              const data = await response.json();
              if(data.message==="done"){
                this.updates = {"action" : "deleted"};
                this.browseControler(this.currentDir, 'default');
              }else{
                //alert("not authorized")
              }
            }
            this.loading = false;
            break;
          }

          case "download": {
            let keys = [];
            let logs = this.log;
            Array.prototype.forEach.call(document.querySelectorAll("input[type=checkbox]:checked"), function (item) {
              if(item.id==="selectAll"){return;}
              keys.push(item.value);
            });
            if(keys.length>0){
              let response;
              try{
                response = await this.$postRequest(endpoint.get() + "getpresignedurls", JSON.stringify({"keys" : keys}), true);
              }catch(e){
                console.log("maybe unauthorized");
                this.setLogged({isLogged:false, name: null});
                this.loading = false;
                return;
              }              
              const data = await response.json();
              for(let i=0,z=data.urls.length;i<z;i++){
                logs.push({"name": keys[i], "downloading" : true});
                await this.$downloadFile(data.urls[i],keys[i]);
                this.updates = {"name": keys[i], "action" : "downloaded"};
              }
            }
            this.loading = false;
            break;
          }

          case "upload": {
            this.uploadMsg = 'uploadingDrag';
            const files = await this.$traverseFileTree(data.items);
            let signedForm;
            try{
              signedForm = (await this.$getRequest(endpoint.get() + "getuploadform?path="+encodeURIComponent(this.currentDir)+"/"));
            }catch(e){
              console.log("maybe unauthorized");
              this.setLogged({isLogged:false, name: null});
              this.loading = false;
              return;
            }
            let formData;
            let path;
            for(let i=0,z=files.length;i<z;i++){
              path = files[i].path.replace(files[i].name,"").slice(1);
              this.log.push({"name": files[i].name, "path": path, "uploading" : true, "randomKey" : +new Date});
              formData = this.$generateFormData(signedForm, files[i].binary, path);
              await this.$postRequest(signedForm.endpoint, formData);
              this.updates = {"name": files[i].name, "action" : "uploaded"};
            }
            this.browseControler(this.currentDir, 'default');
            this.uploadMsg = 'drag';
            break;
          }

          case "uploadFiles": {
            this.uploadMsg = 'uploadingDrag';
            const signedForm = (await this.$getRequest(endpoint.get() + "getuploadform?path="+encodeURIComponent(this.currentDir+"/")));
            let formData;
            let path;
            const randomKey = Math.random();
            if(signedForm.error){
              this.uploadMsg = 'drag';
              this.loading = false;
              break;
            }
            for (var i=0; i<data.length; i++) {
              path = data[i].webkitRelativePath.replace(data[i].name,"");
              this.log.push({"name": data[i].name, "path": path, "uploading" : true, "randomKey" : randomKey});
              formData = this.$generateFormData(signedForm, data[i], path);
              await this.$postRequest(signedForm.endpoint, formData);
              this.updates = {"name": data[i].name, "action" : "uploaded"};
            }
            this.browseControler(this.currentDir, 'default');
            this.uploadMsg = 'drag';
            break;
          }
        }
      },

      async browseControler(path='', route='forward', paginationToken='', folderSearch='') {
        this.loading = true;
        this.fetchError= false;
        this.authError = false;

        if(folderSearch!=='' && folderSearch.charAt(folderSearch.length-1)==="/"){
          folderSearch = '';
        }

        if(!this.isValidToken()){
          this.setLogged({isLogged : false, name: null});
          this.loading = false;
        }
        //path management
        switch(route){
          case 'forward':
            this.currentDir = this.currentDir ? this.$trimSlash(this.currentDir + "/" + path) : path;
            this.log = [];
            break;
          case 'parent': {
            let _cd = this.currentDir;
            let aux;
            if(this.s3data.folders){
              for(let i=0,z=this.s3data.folders.length;i<z; i++){
                aux = _cd.indexOf(this.s3data.folders[i].folder);  
                if(aux>-1 && _cd.length===aux+this.s3data.folders[i].folder.length){
                  _cd = _cd.replace(this.s3data.folders[i].folder,"");
                }
              }
            }

            aux = _cd.split("/");
            aux.pop();
            this.currentDir = aux.join("/");
            this.log = [];
            break;
          }
          case 'home': {
            this.currentDir = '';
            this.log = [];
            break;
          }
          default:
            this.currentDir = path;
        }

        this.checkIfRoot();
        history.pushState(null,'','/'+this.currentDir.replace(/^webftp-protected-files-((\btest\b)|(\bpre\b)|(\bpro\b))/,'campus').replace(/^webftp-files-((\btest\b)|(\bpre\b)|(\bpro\b))/,'public'))

        try{
          if(!paginationToken){
            window.localStorage.removeItem("pagination");  
          }
          let pagination = JSON.parse(window.localStorage.getItem("pagination")) || [''];
          pagination.unshift(paginationToken);
          window.localStorage.setItem("pagination", JSON.stringify(pagination));
          this.s3data = await this.$getRequest(endpoint.get() + "getfiles?path="+encodeURIComponent(this.$trimSlash(this.currentDir))+(paginationToken?"&continuationToken="+encodeURIComponent(paginationToken):"")+(folderSearch!==''?"&folderSearch=false":""));
          this.loading = false;
          this.retrying=false;
        }catch(e){ 
          if(e.http_status===401){
            this.authError = true;
            this.setLogged({isLogged:false, name: null});
            console.log("status 401");
          }else if(e.http_status>=500 || e.status>=500){
            console.log("maybe unauthorized");
            this.setLogged({isLogged:false, name: null});
            return;
          }else{
            if(!this.s3data.isRootForUser && this.currentDir===''){
              this.authError= true;
              console.log("no permissions");
              this.loading = false;
            }else{
              if(!this.retrying || this.retrying<4){
                this.retrying=!this.retrying ? 1 : this.retrying++;
                console.log("retrying");
                await this.sleep(500);
                this.loading = true;
                this.browseControler(path, route, paginationToken, folderSearch);
              }else{
                this.retrying=0;
                this.fetchError= true;
                this.loading = false;
              }
            }
            //this.setLogged({isLogged:false, name: null});
          }
        }
        this.uploadMsg = 'drag';
        this.isRootForUser = this.s3data.isRootForUser || false;
        this.readWrite = this.s3data.access || 'ro';
        this.folderSearch = folderSearch;
        if(folderSearch!==''){
          //this.currentDir = this.currentDir.slice(0, this.currentDir.lastIndexOf("/"));
          this.currentDir = this.currentDir.replace(new RegExp(folderSearch + '$'), "");
        }
        if(this.currentDir.charAt(this.currentDir.length-1)==="/"){
          this.currentDir = this.currentDir.slice(0,-1);
        }
        //this.loading = false;
      }
    }
  }
</script>
