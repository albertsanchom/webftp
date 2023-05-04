<template>
  <div id="upload-area" v-if="!loading && isLogged && !isRoot && !isRootForUser && !authError && readWrite==='rw'"
    v-on:dragover.stop.prevent="uploadMessage('uploadDrag')"
    v-on:dragleave.stop.prevent="uploadMessage('drag')"
    v-on:drop.stop.prevent="drop"
    v-on:click="click"
  >
    <h1 ref="uploadDialog">{{ $t('drag') }}</h1>
    <input type="file" name="file" ref="uploadFile" multiple style="display:none" v-on:change="change" />    
    <!--input type="file" name="file" ref="uploadFolder" webkitdirectory multiple style="display:none" v-on:change="change" /--> 
 </div>
</template>

<style>
  #upload-area{
    border: 2px solid #ccc;
    border-radius: 15px;
    margin-top: 1em;
    text-align: center;
    border: 2px dotted #ccc;
  }

  @media (max-width: 600px) {
    h1{
      font-size:1.1em;
    }  
    #upload-area{
      margin: 1em .5em;
      padding: 1em;
    }
  }
</style>

<script>

  export default {
  name : 'ControlsComponent',
  props : ['isRoot','uploadMsg', 'isLogged', 'isRootForUser', 'authError', 'readWrite', 'loading'],
  watch: { 
    uploadMsg: function(msg) { 
      if(this.uploadMessage){
        this.uploadMessage(msg);
      }
    }   
  }, 
  data () {
    this.messages = this.$i18n.messages[this.$i18n.locale];
    return {};
  },
  methods: {
    sendAction(action) {
      this.$emit('action', action)        
    },
    uploadMessage(message) {
      if(this.$refs.uploadDialog){
        this.$refs.uploadDialog.innerText = this.messages[message];
        if(message==="drag"){
          this.$refs.uploadFile.value = null;
        }
      }
    },
    click() {
      this.$refs.uploadFile.click();
    },
    change() {
      if(this.$refs.uploadFile.files){
        this.$emit('action', 'uploadFiles', this.$refs.uploadFile.files);
      }
    },
    drop(e) {
      this.uploadMessage('uploadingDrag');
      this.$emit('action', 'upload', e.dataTransfer);
    }
  }
  }
</script>
