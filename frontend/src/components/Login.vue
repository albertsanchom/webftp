<template>
  <section id="loginContainer" v-if="!isLogged">
  <div class="type-1">
      <div>
          <a href="/api/auth" id="login" class="btn btn-2" v-on:click="doLogin()">
              <span class="txt">{{ $t('login') }}</span>
              <span class="round"><i class="fa fa-chevron-right"></i></span>
          </a>
      </div>
  </div>
  </section>
</template>

<style>
  #loginContainer{
    margin-top: 4em;
  }
  #loginContainer .btn-2 {
    background-color: #BF0000;
  }
  #loginContainer .btn-2 .round {
    background-color: #e25e5e;
  }
  #loginContainer a {
    text-decoration: none;
    -moz-border-radius: 30px;
    -webkit-border-radius: 30px;
    border-radius: 30px;
    padding: 12px 53px 12px 23px;
    color: #fff;
    text-transform: uppercase;
    font-family: sans-serif;
    font-weight: bold;
    position: relative;
    -moz-transition: all 0.3s;
    -o-transition: all 0.3s;
    -webkit-transition: all 0.3s;
    transition: all 0.3s;
    display: inline-block;
  }
  #loginContainer a:hover:before {
    visibility: hidden;
    transition: none;
  }
  #loginContainer a span {
    position: relative;
    z-index: 3;
  }
  #loginContainer a .round {
    -moz-border-radius: 50%;
    -webkit-border-radius: 50%;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    position: absolute;
    right: 3px;
    top: 3px;
    -moz-transition: all 0.3s ease-out;
    -o-transition: all 0.3s ease-out;
    -webkit-transition: all 0.3s ease-out;
    transition: all 0.3s ease-out;
    z-index: 2;
  }
  #loginContainer a .round i {
    position: absolute;
    top: 50%;
    margin-top: -6px;
    left: 50%;
    margin-left: -4px;
    -moz-transition: all 0.3s;
    -o-transition: all 0.3s;
    -webkit-transition: all 0.3s;
    transition: all 0.3s;
  }
  #loginContainer .txt {
    font-size: .9em;
    line-height: 1.45;
  }
  #loginContainer .type-1 a:hover {
    padding-left: 48px;
    padding-right: 28px;
  }
  #loginContainer .type-1 a:hover .round {
    width: calc(100% - 6px);
    -moz-border-radius: 30px;
    -webkit-border-radius: 30px;
    border-radius: 30px;
  }
  #loginContainer .type-1 a:hover .round i {
    left: 12%;
  }

  @media (max-width: 600px) {
    #loginContainer a {
      font-size: .75em;
      line-height: 1.45;
    }
  }

</style>

<script>
  import endpoint from '@/assets/js/endpoint.js'

  export default {
    name : 'LoginComponent',
    props : ['isLogged'],
    mounted: async function () {
      const that = this;

      let profile = await this.$getRequest(endpoint.get() + "profile");
      if(typeof profile==="object"){
        window.localStorage.setItem("token_name", profile.given_name);
        that.emitLogged({isLogged : true, name : window.localStorage.getItem("token_name")});
      }else{
        console.log("not logged");
        that.emitLogged({isLogged : false, name : null});
      }
    },
    methods: {
      doLogin() {
        if(window.location.pathname.toString().length>"1"){
            window.location.replace("/api/auth?redirect="+window.location.toString());
        }
      },
      emitLogged(data) {
        this.$emit("logged", data);
        //this.$emit('action', 'browse');
        this.$emit('browse', '');
      }
    }
  }
</script>
