<template>
  <div id="browser" v-if="isLogged">

    <template v-if="authError">
        <h3>{{this.messages['authError']}}</h3>
    </template>

    <template v-if="fetchError">
        <h3>{{this.messages['fetchError']}}</h3>
    </template>

    <table id="contents">
      <!-- Breadcrumbs -->
      <tr v-if="currentDir">
        <td colspan='3' class="breadcrumbs">
            <a href='/' v-on:click.prevent="sendBrowse('', 'home')"><i class='fa fa-home'></i></a> <i class='fa fa-angle-right'></i>
            <span v-for="(item, index) in getBreadcrumbs()" :key="index">
              <template v-if="index < Object.keys(getBreadcrumbs()).length - 1">
                <!--&nbsp;-->
                <a :href="'/'+prettyName(item.fullpath)" v-on:click.prevent="sendBrowse(item.fullpath, 'default')" :title="showTitle(item.name)"> 
                  <template v-if="index==0">
                    {{prettyName(item.name)}}
                  </template>
                  <template v-else>
                    {{strShortener(item.name)}} 
                  </template>
                </a> <i class='fa fa-angle-right'></i>
              </template>
              <template v-else>
                  <template v-if="index==0">
                    {{prettyName(item.name)}}
                  </template>
                  <template v-else>
                    {{strShortener(item.name)}} 
                  </template>
              </template>
            </span>
        </td>
        <td class="searchBox">
          <div class="fg--search" v-if="!s3data.user && !s3data.isRootForUser">
            <input type="text" v-on:keyup.enter="sendSearch()" id="pathSearch" :placeholder="this.messages['startSearch']" />  
            <button type="submit" v-on:click="sendSearch()"><i class="fa fa-search"></i></button>
          </div>
        </td>          
      </tr>
      <!-- Parent -->
      <tr v-if="!isRoot">
        <td class="selector">
            <input v-on:change="selectAll()" type='checkbox' id="selectAll" class='ftps3-action' v-if="s3data.KeyCount>0 && !authError"/>
            <a href="#" v-on:click.prevent="sendBrowse(currentDir, 'parent')"><i class="fas fa-level-up-alt fa-flip-horizontal" aria-hidden="true"></i></a>
        </td>
        <td colspan='3' class="right">
          <template v-if="s3data.ContinuationToken">
            <a href="#" v-on:click.prevent="sendBrowse(currentDir,'', getLastToken())"><i class='fa fa-arrow-circle-left fa-2x' aria-hidden='true'></i></a>
          </template>
          <template v-if="s3data.NextContinuationToken">
            <a href="#" v-on:click.prevent="sendBrowse(currentDir,'', s3data.NextContinuationToken)"><i class='fa fa-arrow-circle-right fa-2x' aria-hidden='true'></i></a>
          </template> <!--&nbsp;-->
        </td>
      </tr>
      <template v-if="!authError">
      <!-- Folders -->
      <tr v-for="(item, x) in s3data.CommonPrefixes" :key="'pref'+x">
        <td colspan='4' class="ftps3-item-folder">
          <input v-on:change="checkDownloadAction()" type='checkbox' class='ftps3-action ftps3-action-folder ftps3-action-selectable' v-bind:value="currentDir + '/'+cleanKey(item.Prefix, s3data.Prefix)" v-if="!isRoot && !isRootForUser"/>
          <i class='fa fa-folder' aria-hidden='true'></i> 
            <template v-if="isRoot">
              <a :href="'/'+prettyName(item.Prefix, s3data.Prefix)" v-on:click.prevent="sendBrowse(cleanKey(item.Prefix, s3data.Prefix))" :title="showTitle(item.Prefix, s3data.Prefix)">
                {{prettyName(item.Prefix, s3data.Prefix)}}
              </a>
            </template>
            <template v-else>
              <a :href="'/'+prettyName(this.currentDir)+'/'+cleanKey(item.Prefix, s3data.Prefix)" v-on:click.prevent="sendBrowse(cleanKey(item.Prefix, s3data.Prefix))" :title="showTitle(item.Prefix, s3data.Prefix)">
                {{strShortener(prettyName(item.Prefix, s3data.Prefix))}}
              </a>
            </template>
        </td>
      </tr> 
      <!-- Files -->
      <tr v-for="(item, y) in s3data.Contents" :key="'content'+y">
        <template v-if="cleanKey(item.Key, s3data.Prefix)!==''">
          <td v-if="cleanKey(item.Key, s3data.Prefix)!==''" class="ftps3-item-filename">
            <span v-if="cleanKey(item.Key, s3data.Prefix)!=='' && item.StorageClass!=='GLACIER'" class='selector'>
              <input type='checkbox' class='ftps3-action ftps3-action-selectable' v-bind:value="currentDir + '/'+cleanKey(item.Prefix, s3data.Prefix)+cleanKey(item.Key, s3data.Prefix)" />
            </span>
            <span v-else-if="item.StorageClass==='GLACIER'" title="AWS Glacier">
              🧊
            </span>
            <i class='fa fa-file' aria-hidden='true'></i> <span :title="showTitle(cleanKey(item.Key, s3data.Prefix))">{{strShortener(cleanKey(item.Key, s3data.Prefix))}}</span>
          </td>
          <td class='ftps3-item-filesize'>{{_bytesToSize(item.Size)}}</td>
          <td class='ftps3-item-date'>{{_getDate(item.LastModified)}}</td>
          <td class='ftps3-item-share'>
            <a v-if="hasPublicDomain(s3data.Name)" :href="getPublicUrl(s3data.Name, item.Key, s3data.user)" v-on:click.prevent="doCopy(getPublicUrl(s3data.Name, item.Key, s3data.user))"><i class="fa fa-share-alt fa-lg" aria-hidden="true" :title="$t('copy')"></i></a>
          </td>
        </template>
      </tr>
      </template>
    </table>
  </div>
</template>

<style>
  #browser{
    display: block;
    margin-top: 3em;
  }
  #contents{
    width: 100%;
  }
  #browser, #contents {
    text-align: left;
  }
  table#contents{
    table-layout:initial;
  }
  tr td.selector{
    width: auto;
    min-width: 3%;
  }
  .ftps3-item-filename{
    width: 50%;
  }
  .ftps3-item-folder{
    width: 50%;
  }
  .ftps3-item-date{
    width: 20%;
  }
  .ftps3-item-filesize{
    width: 10%;
  }
  .ftps3-item-share{
    width: 14%;
    text-align: right;
  }
  .fa-home, .fa-level-up-alt{
    font-size: 1.3em;
  }
  .searchBox{
    width: 29%; 
    min-width: 29%;
    padding-top:0;
  }
  .searchBox input{
    width:100%;
    min-width:100%;
    display: block;  
  }
  .breadcrumbs{
    width: 70%;
    min-width: 70%;
    max-width: 70%;
  }

  td.right{
    text-align: right;
    width:99%;
    min-width:99%;
    max-width:99%;
  }

  td i{margin-right: 0.2em;}

  .breadcrumbs td i{margin-right: 0em;}
  .breadcrumbs td span{padding-left: 0em;}


  .fg--search {
    position: relative;
  }
  .fg--search input {
    width: 100%;
    display: block;
  }

  .fg--search button {
    background: transparent;
    border: none;
    cursor: pointer;
    display: inline-block;
    font-size: 17px;
    position: absolute;
    color: blue;
    top: 0;
    right: 0;
    padding: 18px 20px;
  }

  @media (max-width: 600px) {
    #app{
      max-width: 100%;
    }
    tr td.selector{
      width: 20%;
    }
    .ftps3-item-date,.ftps3-item-filesize{
      display: none;
    }
    .ftps3-item-folder,.ftps3-item-filename{
      width: 98%;
    }
    #browser{
      margin-top: 1em;
      padding-left: .5em;
    }
    table tr{
      display: block;
    }
    .breadcrumbs{
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      display: inline-block;
      clear:both;
    }
    .searchBox{
      width: 100%; 
      display: inline-block;
      clear:both;
    }
    .searchBox input{
      width: 100%;
      display: block;
    }
    .fg--search button {
      padding: 2px 10px;
    }
  }
</style>

<script>

  export default {
    name : 'BrowserComponent',
    props : ['s3data','currentDir', 'loading', 'isRoot', 'isRootForUser', 'isLogged', 'config', 'authError', 'fetchError', 'folderSearch'],
    data() {
      this.messages = this.$i18n.messages[this.$i18n.locale];
      return {}
    },
    watch: { 
      loading: function(v) { 
        if(v===false){
          this.checkDownloadAction();
        }
      }   
    },       
    methods: {
        getLastToken() {
          let pagination = JSON.parse(window.localStorage.getItem("pagination") || "[]");
          let token = pagination.shift();
          if(pagination.length>0){
            token = pagination.shift();
          }else{
            pagination = [''];
          }
          window.localStorage.setItem("pagination", JSON.stringify(pagination));
          return token;
        },
        sendBrowse(path='', route='forward', paginationToken) {
          this.$emit('browse', path, route, paginationToken);
        },
        sendSearch() {
          const path = document.getElementById("pathSearch").value;
          if(!path){return;}
          this.$emit('browse', this.currentDir + "/" + path, 'default', '', path);
        },
        cleanKey(item, prefix) {
          if(item){
            if(this.folderSearch!=='' && prefix){
              //prefix = prefix.slice(0, prefix.lastIndexOf("/"))
              prefix = prefix.replace(new RegExp(this.folderSearch + '$'), '');
            }
            return this.$trimSlash(item.replace(prefix, ""));
          }
          return "";
        },
        prettyName(item, prefix) {
          item = this.$trimSlash(item);
          if(item.indexOf("webftp-protected-files")>-1){
            //return "campus";
            return item.replace(/^webftp-protected-files-((\bdev\b)|(\btest\b)|(\bpre\b)|(\bpro\b))/,'protected');
          }else if(item.indexOf("webftp-files")>-1){
            //return "public";
            return item.replace(/^webftp-files-((\bdev\b)|(\btest\b)|(\bpre\b)|(\bpro\b))/,'public');
          }else{
            return this.cleanKey(item, prefix);
          }
        },
        getBreadcrumbs() {
          if(!this.currentDir || !this.currentDir.split){
            return [];
          }

          let strBreadcrumbs = this.currentDir;
          if(this.s3data.folders){
            for(let i=0,z=this.s3data.folders.length;i<z; i++){
              if(strBreadcrumbs.indexOf(this.s3data.folders[i].folder)>-1){
                strBreadcrumbs = strBreadcrumbs.replace(this.s3data.folders[i].folder, this.s3data.folders[i].folder.replace(/\//g,"€€"));
              }
            }
          }

          const bc = strBreadcrumbs.split("/");
          let paths = [];
          for(let i=0,z=bc.length;i<z;i++){
            paths.push({name:bc[i].replace(/€€/g,"/"), fullpath:bc.slice(0,i+1).join('/').replace(/€€/g,"/"), link:(i===z-1?false:true)});
          }
          
          return paths;
        },
        _bytesToSize(bytes) {
          const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
          if (bytes == 0){return '0 Byte';}
          const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
          return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        },
        _getDate(_date) {
          _date = new Date(_date);
          return ('0' + _date.getDate()).slice(-2) + "/" + ('0'+(_date.getMonth()+1)).slice(-2) +  "/" + _date.getFullYear() + " - " + ('0' + _date.getHours()).slice(-2) + ":" + ('0' + _date.getMinutes()).slice(-2);
        },
        selectAll(){
          let action = 1;
          Array.prototype.forEach.call(document.querySelectorAll("input[type=checkbox]"), function (item, i) {
            if(i===0){
              action = item.checked ? -1 : 0;
              return;
            }         
            item.checked=action;
          });
          this.checkDownloadAction();
        },
        checkDownloadAction(){
          let download = document.querySelectorAll("i.fa-download");
          download = download.length>0 ? download[0] : null;
          let folderChecked = false;
          if(document.querySelectorAll("input[type=checkbox]:checked.ftps3-action-folder").length>0){
            folderChecked = true;
          }
          if(download && folderChecked){
            download.style.display = "none";
          }else if(download){
            download.style.display = "inline";
          }
        },
        /*checkPublicResource(publicResources, bucketName, key) {
          for(let i=0,z=publicResources.length;i<z;i++){
            if((bucketName + "/" + key).startsWith(publicResources[i])) {
              return true;
            }
          }
          return false;
        },*/
        getPublicUrl(bucketName, key, user) {
          var cdnDomain = this.config.cdnDomains[bucketName];
          if(user){
            for(let i=0;i<this.s3data.folders.length;i++){
              if(key.indexOf(this.s3data.folders[i].folder)===0){
                key = key.replace(this.s3data.folders[i].folder, this.s3data.folders[i].folder + "/" + user);
                break;
              }
            }
          }
          key = key.split("/").map(k => {
            return encodeURIComponent(k);
          }).join("/");
          
          return 'https://'+cdnDomain+'/'+key;
        },
        hasPublicDomain(bucketName) {
          return this.config.cdnDomains[bucketName] || false;
        },
        doCopy (text) {
          const _copied = this.messages.copied;
          const _notcopied = this.messages.notcopied;
          this.$copyText(text).then(function () {
            alert('URL ' + text + ' ' + _copied)
            //alert('URL ' + text + ' copied to clipboard!')
          }, function (e) {
            alert(_notcopied)
            console.log(e)
          })
        },
        showTitle (a,b) {
          const pretty = this.prettyName(a,b);
          const shortened = this.strShortener(pretty);
          if(pretty!==shortened){
            return pretty;
          }
          return null;
        }
    }
  }
</script>
