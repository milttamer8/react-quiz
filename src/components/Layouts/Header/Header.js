import React from 'react'
import $ from 'jquery';
import Navmenu from '../Navmenu';
import UserProfile from '../../../session/UserProfile';

export default function index() {
    const site = UserProfile.getSite();
    return (
        
        <header className={"header " + UserProfile.getSite()}>
            {/* <Navmenu /> */}
            {
                site === "core" ? 
                <div className="banner">
                    <img className="img d-none d-sm-block" src="./assets/images/home/header.jpg" alt="banner-meetic" />
                    <img className="logo d-none d-sm-block" src="./assets/images/home/Logo-live.png" alt="Logo live meetic" />
                </div>
                : 
                <div className="banner">
                    <img className="logo d-none d-sm-block" src="./assets/images/home/Logo-senior.png" alt="Logo live meetic" />
                </div>
            }
        </header>
    )
}


// // Sticky menu 
// $(window).scroll(function(){
//     if ($(window).scrollTop() >= 60) {
//         $('.header').addClass('fixed-header');
//     }
//     else {
//         $('.header').removeClass('fixed-header');
//     }
// });
