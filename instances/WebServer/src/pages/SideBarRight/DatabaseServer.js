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
import {consolePrint} from 'Utils/Utils'
import {request_available_metrics} from 'Utils/Utils'
import {request_available_methods} from 'pages/SideBarLeft/Algorithms'
import {request_database_content} from 'pages/SideBarRight/Database'
import {server_request} from 'Utils/Connection'
import {RelayServer, active_server} from 'Utils/System'
import {WebRTCConnection} from 'Utils/System';
import './DatabaseServer.scss';

export const createServerButtons = (stat_obj) => {
    const icon_availability_yes = "assets/icons/icon_availability_yes.png";
    const icon_availability_no = "assets/icons/icon_availability_no.png";

    $("#dbserver_body").html("")
    for (let key in stat_obj) {
        let elem = stat_obj[key];
        var d = document.createElement('div');

        $(d).addClass("tooltip server_item").attr("title", elem["sid"]).appendTo($("#dbserver_body"))

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


            
        //     active_server = elem["protocol"] +"://" + elem["address"] + ":" + elem["port"]
        //     request_server_status(active_server)
        //     request_available_methods(active_server)
        //     request_database_content(active_server)
        //     request_available_metrics(active_server)
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
function DatabaseServer(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});
    const icon_server = "assets/icons/icon_server_grey.png";
    const icon_server_request_button = "assets/icons/icon_export_metric.png";
    const icon_forward = "assets/icons/icon_arrow_right.png";

    const [databaseList, setDatabaseList] = useState(null);
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);


    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Create buttons for each available database server.
     **************************************************************************************************************/
    useEffect(() => {
        if (databaseList !== null) {
            console.debug("%c[INFO] Create Database Server Buttons for each database in received Dictionary", "color: orange")
            //createServerButtons(databaseList)
        }
    }, [databaseList]);

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
     * 
     **************************************************************************************************************/
    // function createServerButtons(stat_obj) {
    //     $("#dbserver_body").html("")
    //     for (let key in stat_obj) {
    //         let elem = stat_obj[key];
    //         var d = document.createElement('div');

    //         $(d).addClass("tooltip server_item").attr("title", elem["sid"]).appendTo($("#dbserver_body"))

    //         var d_icon = document.createElement('img');
    //         $(d_icon).addClass("dbserver_item_icon").attr("src", icon_availability_yes).appendTo($(d))


    //         var d_text = document.createElement('div');
    //         $(d_text).addClass("dbserver_item_text").html(elem["name"]).appendTo($(d))

    //         $(d).on("click", function(){
    //             console.debug("%c[INFO] Create offer for selected Database:", "color: orange", elem)
    //             WebRTCConnection.createOffer(key)
    //         //     active_server = elem["protocol"] +"://" + elem["address"] + ":" + elem["port"]
    //         //     request_server_status(active_server)
    //         //     request_available_methods(active_server)
    //         //     request_database_content(active_server)
    //         //     request_available_metrics(active_server)
    //             if (window.innerWidth < 1000) {
    //                 $("#dbserver_main").css("display", "none")
    //                 $("#database_main").css("display", "block")
    //             }
    //         });
    //     }
    // }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    // function request_server_status(server_address) {
    //     var stat_obj = server_request("GET", "server_status", server_address, null)

    //     if (stat_obj["enabled"]) 
    //         consolePrint("INFO", "Server is running at " + stat_obj["data"])
    //     else 
    //         consolePrint("WARNING", "No server instance is running")
    // }

    /**************************************************************************************************************
     * Request available color transfer methods and create buttons to apply these algorithms.
     **************************************************************************************************************/
    // function request_available_servers() {
    //     let stat_obj = server_request("GET", "available_servers", RelayServer, null)

    //     if (stat_obj["enabled"]) 
    //         consolePrint("INFO", "Servers were found... ")
    //     else 
    //         consolePrint("WARNING", "No server instance is running")

    //     // check if the request of available servers is fulfilled
    //     if (stat_obj["enabled"]) 
    //         createServerButtons(stat_obj)
    //     else
    //         $("#server_body").html("")
    // }

    /**************************************************************************************************************
     * create the color transfer methods based on the request sent to the python server
     **************************************************************************************************************/
    // function createServerButtons(stat_obj) {
    //     $("#server_body").html("")
    //     for (let elem of stat_obj["data"]){
    //         var d = document.createElement('div');

    //         $(d).addClass("tooltip server_item").attr("title", elem["address"] + ":" + elem["port"]).appendTo($("#server_body"))

    //         var d_icon = document.createElement('img');
    //         if(elem["visibility"] === "public") 
    //             $(d_icon).addClass("server_item_icon").attr("src", icon_availability_yes).appendTo($(d))
    //         else
    //             $(d_icon).addClass("server_item_icon").attr("src", icon_availability_yes).appendTo($(d))

    //         var d_text = document.createElement('div');
    //         $(d_text).addClass("server_item_text").html(elem["name"]).appendTo($(d))

    //         $(d).on("click", function(){
    //             active_server = elem["protocol"] +"://" + elem["address"] + ":" + elem["port"]
    //             request_server_status(active_server)
    //             request_available_methods(active_server)
    //             request_database_content(active_server)
    //             request_available_metrics(active_server)
    //         });
    //     }
    // }

    /**************************************************************************************************************
     * Send Request to Server to get the list of databases.
     **************************************************************************************************************/
    // function handleRequestServers() {
    //     console.debug("%c[SEND] WebRTC Request to Server: Get List of Databases via /database", "color: lightgreen")
    //     WebRTCConnection.sendServerMessage("/database", setDatabaseList)
    // }

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
        <div id="dbserver_body">
            {/* <div className="database_elem"/> */}
        </div>
    </div>
    );
}

export default DatabaseServer;
