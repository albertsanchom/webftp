<template>
    <div class="header-2 brand-header brand-secondary">
        <div class="container clearfix">
            <div class="col-clear nav-menu-top">
                <div class="hidden-xs hidden-sm desktop-menu">
                    <div class="col-md-1 top-logo top-logo-desktop hidden-xs hidden-sm col-clear">
                        <a href="https://uoc.edu" title="Universitat Oberta de Catalunya"><img src="@/assets/img/uoc-logo.png" class="img-responsive w100" title="Universitat Oberta de Catalunya" alt="Universitat Oberta de Catalunya"></a>
                    </div>
                    <div class="col-md-10 col-lg-10 top-slogan col-clear-right">
                        <span class="ruler ruler--white w100-inline-block"></span>
                        <h2 class="nav-menu-title font-default">Universitat Oberta de Catalunya</h2>
                        <span class="ruler ruler--white w100-inline-block"></span>
                    </div>
                    
                </div>
                <div class="hidden-lg hidden-xl hidden-md">
                    <div class="mobile-menu">
                        <div class="menu-mobile-container">
                            <div class="top-logo">
                                <a href="https://uoc.edu" title="Universitat Oberta de Catalunya">
                                    <img src="@/assets/img/uoc-logo.png" class="img-responsive w100" title="Universitat Oberta de Catalunya" alt="Universitat Oberta de Catalunya">
                                </a>
                            </div>
                            <div class="top-slogan">
                                <h2 class="ruler ruler--double ruler--white w100-inline-block nav-menu-title font-default">Universitat Oberta de Catalunya</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
    a{background-color:transparent;}
    a:active{outline:0;}
    a:hover{outline:0;}
    div:focus{outline:0;}
    img{border:0;}
    *,*:before,*:after{-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;}
    h2{margin-top:0;margin-bottom:.5rem;}
    a{color:#000078;text-decoration:none;}
    a:hover{color:#706F6F;text-decoration:none;}
    img{max-width:100%;height:auto;}
    .ruler{border:0 solid #D0D0D0;border-top-width:4px;}
    .ruler--double{border-bottom-width:4px;}
    h2{font-size:2.5rem;line-height:0.95;font-weight:600;font-family:uoc-sans, Arial;color:inherit;margin-bottom:16px;}
    .font-default{font-family:uoc-sans, Arial;font-weight:400;}
    .brand-header{padding:14px 0 13px;max-height:70px;}
    .brand-header.brand-secondary{background:#73EDFF;}
    .brand-header .top-logo{padding-left:0;max-width:60px;}
    .brand-header .w100-inline-block{width:100%;float:left;display:inline-block;}
    .brand-header .ruler--white{border-color:#FFFFFF;}
    .brand-header .nav-menu-title{font-family:uoc-serif, Georgia;float:left;font-size:0.87rem;max-width:110px;min-height:35px;margin:0;}
    @media (max-width: 1200px) and (min-width: 992px){
    .brand-header .nav-menu-title{font-size:0.83rem;}
    }
    .brand-header .nav-menu-top .top-logo{height:43px;}
    .brand-header .nav-menu-top .top-logo img{height:43px;max-width:57px;}
    @media (max-width: 1200px) and (min-width: 992px){
    .brand-header .nav-menu-top .top-logo img{max-width:100%;width:100%;}
    }
    .brand-header .mobile-menu{width:100%;}
    .brand-header .mobile-menu .menu-mobile-container{position:relative;padding-left:64px;padding-right:64px;}
    .brand-header .mobile-menu .menu-mobile-container .top-slogan{width:100%;}
    .brand-header .mobile-menu .menu-mobile-container .top-slogan .nav-menu-title{height:44px;font-size:.875rem;min-width:110px;max-width:100%;}
    .brand-header .mobile-menu .menu-mobile-container .top-logo{position:absolute;left:0;width:58px;padding-right:0;}
    .brand-header .mobile-menu .menu-mobile-container .top-logo img{min-width:58px;height:44px;width:58px;}
    @media (min-width: 992px){
    .header-2 .desktop-menu .top-slogan{width:calc( 83.3333333333% + 1.25rem);}
    }
    @media (min-width: 1200px){
    .header-2 .desktop-menu .top-slogan{width:calc( 83.3333333333% + 2.375rem);}
    }
    .header-2 .mobile-menu .menu-mobile-container{padding-right:0;}
    @media (max-width: 543.9px){
    .hidden-xs{display:none!important;}
    }
    @media (min-width: 544px) and (max-width: 767.9px){
    .hidden-sm{display:none!important;}
    }
    @media (min-width: 768px) and (max-width: 991.9px){
    .hidden-md{display:none!important;}
    }
    @media (min-width: 992px) and (max-width: 1199.9px){
    .hidden-lg{display:none!important;}
    }
    @media (min-width: 1200px){
    .hidden-xl{display:none!important;}
    }
    .container{max-width:75.25rem;margin-right:auto;margin-left:auto;padding-left:0.75rem;padding-right:0.75rem;}
    .container:before,.container:after{content:" ";display:table;}
    .container:after{clear:both;}
    .col-md-1,.col-md-10,.col-lg-10{position:relative;min-height:1px;padding-left:0.125rem;padding-right:0.125rem;}
    @media (min-width: 768px){
    .col-md-1,.col-md-10,.col-lg-10{padding-left:0.25rem;padding-right:0.25rem;}
    }
    @media (min-width: 768px){
    .col-md-1,.col-md-10{float:left;}
    .col-md-1{width:8.3333333333%;}
    .col-md-10{width:83.3333333333%;}
    }
    @media (min-width: 992px){
    .col-lg-10{float:left;}
    .col-lg-10{width:83.3333333333%;}
    }
    .clearfix:before,.clearfix:after{content:" ";display:table;}
    .clearfix:after{clear:both;}
    [class^="col-"]{padding-right:15px;padding-left:15px;}
    .w100{width:100%!important;}
    .col-clear{padding-left:0!important;padding-right:0!important;}
    .col-clear-right{padding-right:0!important;}
    .brand-header{max-height:none;}
    .brand-header .mobile-menu .menu-mobile-container{padding:0;}
    .brand-header .mobile-menu .menu-mobile-container .top-logo{float:left;position:relative;width:57px;}
    .brand-header .mobile-menu .menu-mobile-container .top-logo img{height:auto;}
    .brand-header .mobile-menu .menu-mobile-container .top-slogan{float:left;padding-left:10px;width:calc( 100% - 57px);}
    .brand-header .nav-menu-top .top-logo{max-width:57px;height:auto;}
    .brand-header .nav-menu-top .top-logo a{display:inline-block;}
    .brand-header .nav-menu-top .top-logo img{height:auto;}
    .nav-menu-top [class^="col-"]{padding-right:10px;padding-left:10px;}
    @media (min-width: 48em){
    .container{width:750px;}
    }
    @media (min-width: 62em){
    .container{width:970px;}
    }
    @media (min-width: 75em){
    .container{width:1170px;}
    }
    @media (max-width: 61.99em){
    .nav-menu-top [class^="col-"]{padding-right:7px;padding-left:7px;}
    }

</style>
