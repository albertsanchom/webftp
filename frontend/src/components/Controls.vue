<template>
    <div id="actions" v-if="isLogged">
        <h2 class="pull-left">Hola {{userName}}</h2>
        <span v-if="!authError">
        <a href="#" v-on:click.prevent="sendAction('create')" v-if="!isRoot && !isRootForUser && readWrite==='rw'" class="pull-right"><i class="fa fa-folder-plus fa-2x" aria-hidden="true" :title="$t('actionAdd')"></i></a>
        <a href="#" v-on:click.prevent="sendAction('browse')" v-if="!isRoot && !isRootForUser" class="pull-right"><i class="fa fa-sync fa-2x" aria-hidden="true" :title="$t('actionRefresh')"></i></a>
        <a href="#" v-on:click.prevent="sendAction('download')" v-if="!isRoot && !isRootForUser" class="pull-right"><i class="fa fa-download fa-2x" aria-hidden="true" :title="$t('actionDownload')"></i></a>
        <a href="#" v-on:click.prevent="sendAction('delete')" v-if="!isRoot && !isRootForUser && readWrite==='rw'" class="pull-right icon-delete"><i class="fa fa-trash fa-2x" aria-hidden="true" :title="$t('actionDelete')"></i></a>
        </span>
        <a :href="endpoint+`logout`"><i class="fa fa-right-from-bracket fa-2x" aria-hidden="true" :title="$t('actionLogout')"></i></a>
    </div>
</template>

<style>

  h2.pull-left a{font-size:.4em;}

  .pull-left{
      float: left;
  }

  .pull-right{
      float: right;
  }

  .icon-delete{
    margin-right: 3em!important;
  }

  #actions a{
      margin-right: .5em;
  }

  #actions h2{
      margin-top: 0;
  }

  #actions a:hover:before {
    visibility: hidden;
    transition: none;
  }

  @media (max-width: 600px) {
    #actions a{
        font-size: .7em;
    }
    #actions h2.pull-left, #actions a.pull-right{
        float: none;
        width: 100%;
    }
    .icon-delete{
      margin-left: 3em!important;
    }
  }
</style>

<script>

  export default {
    name : 'ControlsComponent',
    props : ['isRoot','isRootForUser', 'userName', 'isLogged', 'authError', 'readWrite', 'endpoint'],
    methods: {
        sendAction(action, data){
          this.$emit('action', action, data);
        }
    }
  }
</script>
