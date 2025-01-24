/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect} from "react";
import $ from 'jquery';

import {consolePrint} from 'Utils/Utils'
import {WebRTCConnection} from 'Utils/System';
import './ComputeNode.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** EXPORTED FUNCTIONS
 ******************************************************************************************************************
 ******************************************************************************************************************/

/******************************************************************************************************************
 * Create the buttons for the compute nodes
 ******************************************************************************************************************/
export const createServerButtons = (stat_obj) => {
    const icon_availability_yes = "assets/icons/icon_availability_yes.png";
    const icon_availability_no = "assets/icons/icon_availability_no.png";

    $("#dbserver_body").html("")
    for (let key in stat_obj) {
        let elem = stat_obj[key];
        var d = document.createElement('div');

        $(d).addClass("tooltip dbserver_item").attr("title", elem["sid"]).appendTo($("#dbserver_body"))

        var d_icon = document.createElement('img');
        if (elem["status"] === "Idle")
            $(d_icon).addClass("dbserver_item_icon").attr("src", icon_availability_yes).appendTo($(d))
        else if (elem["status"] === "Busy")
            $(d_icon).addClass("dbserver_item_icon").attr("src", icon_availability_no).appendTo($(d))

        var d_text = document.createElement('div');
        $(d_text).addClass("dbserver_item_text").html(elem["name"]).appendTo($(d))

        $(d).on("click", function(){
            if (elem["status"] === "Idle") {
                console.debug("%c[INFO] Create offer for selected Database:", "color: orange", elem)
                WebRTCConnection.createOffer(key)
            }
            else if (elem["status"] === "Busy") {
                console.debug("%c[INFO] Database is already connected with a client", "color: orange", elem)
                consolePrint("WARNING", "Database is busy. Either you are already connected or the database is in use.")
            }

            if (window.innerWidth < 1000) {
                $("#dbserver_main").css("display", "none")
                $("#database_main").css("display", "block")
            }
        });
    }
}


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function ComputeNode(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    const icon_server = "assets/icons/icon_server_grey.png";
    const icon_forward = "assets/icons/icon_arrow_right.png";


    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Update the style of the console component depending on the window width.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        setMobileMaxWidth(String(styles.getPropertyValue('--mobile-max-width')).trim());

        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                setComponentStyle({display: "none", width: "calc(100% - 6px)", top: "0px", height: "calc(100% - 6px)"});
                
            } else {
                setComponentStyle({});
            }
        };

        updateComponentStyle();
        window.addEventListener('resize', updateComponentStyle);

        return () => {
            window.removeEventListener('resize', updateComponentStyle);
        };
    }, []);


    let forwardButtonStyle = {};
    if (window.innerWidth < mobileMaxWidth) {
        forwardButtonStyle = {display:"block"}
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Info: the corresponing button is only shown in mobile mode
     * Hide the database server window and show the database window
     **************************************************************************************************************/
    function forwardToDatabase() {
        $("#database_main").css("display", "block")
        $("#dbserver_main").css("display", "none")
        $("#body_preview").css("display", "none")
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id="dbserver_main" style={componentStyle}>
            <div id="dbserver_header">
                <img id='dbserver_header_logo' src={icon_server} alt=""/>
                <div id='dbserver_header_name'>COMPUTE NODE</div>
                <div id='dbserver_forward_button' onClick={forwardToDatabase} style={forwardButtonStyle}>
                    <img id="dbserver_forward_icon" src={icon_forward}/>
                </div>
            </div>
            <div id="dbserver_body"/>
        </div>
    );
}

export default ComputeNode;
