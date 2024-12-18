/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect} from "react";
import $ from 'jquery';
import './Header.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** Defined the header of the webpage containing a clickable logo which redirects to the page 
 ** https://potechius.com, the title of the webpage (with the version number), the version number of the app and 
 ** a button which redirects to the github page of the app.
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Header(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});
    const logo_header = "assets/logo.png";
    const icon_menu_button = "assets/icons/icon_menu.png";
    const icon_github_button = "assets/icons/icon_github.png";
    const title_header = "ColorTransferLab";
    const version_header = "v 3.0.0"

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                setComponentStyle({ display: "block"});
                //$("#Header_github").css({marginLeft: "calc(100vw - 100px)"})
            } else {
                setComponentStyle({});
                //$("#Header_github").css({marginLeft: "calc(100vw - 50px)"})
            }
        };

        updateComponentStyle();
        window.addEventListener('resize', updateComponentStyle);

        return () => {
            window.removeEventListener('resize', updateComponentStyle);
        };
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Toogles the menu of the webpage. Menu button is only visible on mobile devices.
     **************************************************************************************************************/
    function toogleMenu() {
        if ($("#body_menu").css("display") === "none") {
            $("#body_menu").css("display", "block")
        } else {
            $("#body_menu").css("display", "none")
        }
    }

    function openFeedback() {
        $("#feedback-container").css("display", "block");
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <header id='Header_header'>
            <a href="https://potechius.com" target="_blank" rel="noreferrer">
                <img id="Header_logo" src={logo_header} alt=""/>
            </a>
            <div id="Header_text" >{title_header}</div>
            <div id="header_version">{version_header}</div>


            <div id="header-container">
                <div id="Header_feedback" onClick={openFeedback} >
                    Feedback
                </div>

                <a id="Header_github" href="https://github.com/ImmersiveMediaLaboratory/ColorTransferLab" target="_blank" rel="noreferrer">
                    <img id="Header_github_logo" src={icon_github_button} alt=""/>
                </a>

                <div id="Header_menu" style={componentStyle}> 
                    <img id="Header_menu_logo" onClick={toogleMenu} src={icon_menu_button} alt=""/>
                </div>
            </div>



        </header>
    );
}

export default Header;