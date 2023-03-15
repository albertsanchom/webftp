<template>
  <section id="loginContainer" v-if="!isLogged">
  <div class="type-1">
      <div>
          <a href="/api/getJWT" id="login" class="btn btn-2">
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

  const decoder = (base64url) => {
    let json_string;
    try {
      const base64 = base64url.replace('-', '+').replace('_', '/');
      const utf8 = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const json = JSON.parse(utf8);
      json_string = JSON.stringify(json, null, 4);
    } catch (err) {
      json_string = "Bad Section.\nError: " + err.message;
    }
    return json_string;
  }

  //gets cookie
  const getCookieValue = (name) => {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
    return null;
  }

  export default {
    name : 'LoginComponent',
    props : ['isLogged'],
    mounted: function () {
      const that = this;

      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const token = urlParams.get('token');

      let token_ttl=window.localStorage.getItem("token_ttl");
      //let token_ttl = -1;
      //let campusJWT = token;
      let campusJWT = getCookieValue('campusJWT');
      if(campusJWT){ // if token from campus exists tries to use it
        window.localStorage.setItem("token", campusJWT);
        try{
          campusJWT = JSON.parse(decoder(campusJWT.split(".")[1]));
          token_ttl = campusJWT.exp;
          window.localStorage.setItem("token_ttl", token_ttl);
          //campusJWT = JSON.parse(campusJWT.sub);
          console.log("campusJWT:" + campusJWT);
          window.localStorage.setItem("token_name", campusJWT["urn:oid:2.5.4.42"]);
        }catch(e){
          console.error("token error");
        }
      }

      if((+new Date()/1000)>token_ttl){
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("token_ttl");
        window.localStorage.removeItem("token_name");
        that.emitLogged({isLogged : false, name : null});
      }else{
        that.emitLogged({isLogged : true, name : window.localStorage.getItem("token_name")});
      }
    },
    methods: {
      doLogin() {
        const w=430, h=430;
        const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
        const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        const left = ((width / 2) - (w / 2)) + dualScreenLeft;
        const top = ((height / 2) - (h / 2)) + dualScreenTop;
        window.LoginWindow = window.open(endpoint.get()+"getJWT", "Login", 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        if (window.focus) {
          window.LoginWindow.focus();
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
