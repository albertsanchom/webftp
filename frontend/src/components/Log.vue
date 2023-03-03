<template>
  <section v-if="isLogged && !isRoot"> 
    <div class="log-area" ref="logs">
        <template v-for="item in log">
            <span :key="item.name + item.randomKey" v-if="item.uploading" :class='"ftps3-action-log-"+cleanName(item.name)'><span>{{ $t('uploading') }}</span> {{strShortener(item.path+item.name)}}</span>
            <span :key="item.name + item.randomKey" v-if="item.deleting" class="ftps3-action-log-deleting"><span>{{ $t('deleting') }}</span> {{strShortener(item.name.split("/").slice(1).join("/"))}}</span>
            <span :key="item.name + item.randomKey" v-if="item.downloading" :class='"ftps3-action-log-"+cleanName(item.name)'><span>{{ $t('downloading') }}</span> {{strShortener(item.name)}}</span>
            <span :key="item.name + item.randomKey" v-if="item.creating" :class='"ftps3-action-log-"+cleanName(item.name)'><span>{{ $t('creating') }}</span> {{strShortener(item.path+"/"+item.name)}}</span>
        </template>
    </div>
  </section>
</template>

<style>
  #container div.log-area{
    margin-top: 1em;
    text-align: left;
    display: flex;
    flex-direction: column-reverse;
  }

  @media (max-width: 600px) {
    #container div.log-area{
      margin: 0 .5em;
    }
  }

</style>

<script>
 
  export default {
    name : 'LogComponent',
    props : ['log', 'updates', 'isRoot', 'isLogged', 'clearLog'],
    watch: {
        updates: function(item) { // watch it
          let _className, logline, loglines;
          //let item = _array[_array.length-1];
          const messages = this.$i18n.messages[this.$i18n.locale];
          switch(item.action){
            case "uploaded":{
              _className = ".ftps3-action-log-"+this.cleanName(item.name);
              logline = this.$refs.logs.querySelector(_className);
              logline.firstChild.innerText = messages.uploaded;
              logline.classList.remove(_className.slice(1));
              break;
            }
            case "deleted": {
              _className = ".ftps3-action-log-deleting";
              loglines = this.$refs.logs.querySelectorAll(_className);
              [].forEach.call(loglines, function(line) {
                line.firstChild.innerText = messages.deleted;
                line.classList.remove(_className.slice(1));
              });
              break;
            }  
            case "downloaded":{
              _className = ".ftps3-action-log-"+this.cleanName(item.name);
              logline = this.$refs.logs.querySelector(_className);
              logline.firstChild.innerText = messages.downloaded;
              logline.classList.remove(_className.slice(1));
              break;
            }
            case "created":{
              _className = ".ftps3-action-log-"+this.cleanName(item.name);
              logline = this.$refs.logs.querySelector(_className);
              logline.firstChild.innerText = messages.created;
              logline.classList.remove(_className.slice(1));
              break;
            }
          }
        }
    },
    methods : {
      cleanName(_name) {
        return _name.replace(/(?!\w|\s)./g, '')
                    .replace(/\s+/g, '-')
                    .replace(/^(\s*)([\W\w]*)(\b\s*$)/g, '$2');
      },
    }
  }

</script>
