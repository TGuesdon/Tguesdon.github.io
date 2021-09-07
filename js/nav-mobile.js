// Mobile hamburger menu :

window.onload = function(){
    if( window.innerWidth <= 900 ){
        document.getElementById('tg_nav_menu').style.display = "none";
    }else{
        document.getElementById('tg_nav_menu').style.display = "block";
    }
}

window.onresize = function(){
    if( window.innerWidth <= 900 ){
        document.getElementById('tg_nav_menu').style.display = "none";
    }else{
        document.getElementById('tg_nav_menu').style.display = "block";
    }
}

document.getElementById('tg_nav_mobile_hamburger_button').onclick = function(){
    if( document.getElementById('tg_nav_menu').style.display == "none" ){
        document.getElementById('tg_nav_menu').style.display = "block";
    }else if( document.getElementById('tg_nav_menu').style.display == "block" ){
        document.getElementById('tg_nav_menu').style.display = "none";
    }
}