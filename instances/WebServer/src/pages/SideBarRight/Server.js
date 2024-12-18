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
import './Server.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Server(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});
    const icon_availability_yes = "assets/icons/icon_availability_yes.png";
    const icon_server = "assets/icons/icon_server_grey.png";
    const icon_server_request_button = "assets/icons/icon_export_metric.png";

    const [serverList, setServerList] = useState(null);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    useEffect(() => {
        if (serverList !== null) {
            createServerButtonsNew(serverList)
        }
    }, [serverList]);

    /**************************************************************************************************************
     * Update the style of the console component depending on the window width.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
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

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    function request_server_status(server_address) {
        var stat_obj = server_request("GET", "server_status", server_address, null)

        if (stat_obj["enabled"]) 
            consolePrint("INFO", "Server is running at " + stat_obj["data"])
        else 
            consolePrint("WARNING", "No server instance is running")
    }

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
    function createServerButtonsNew(stat_obj) {
        $("#server_body").html("")
        for (let key in stat_obj) {
            let elem = stat_obj[key];
            var d = document.createElement('div');

            $(d).addClass("tooltip server_item").attr("title", elem["id"]).appendTo($("#server_body"))

            var d_icon = document.createElement('img');
            $(d_icon).addClass("server_item_icon").attr("src", icon_availability_yes).appendTo($(d))


            var d_text = document.createElement('div');
            $(d_text).addClass("server_item_text").html(elem["name"]).appendTo($(d))

            // $(d).on("click", function(){
            //     active_server = elem["protocol"] +"://" + elem["address"] + ":" + elem["port"]
            //     request_server_status(active_server)
            //     request_available_methods(active_server)
            //     request_database_content(active_server)
            //     request_available_metrics(active_server)
            // });
        }
    }

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
     * 
     **************************************************************************************************************/
    function handleRequestServers() {
        WebRTCConnection.sendServerMessage("/computeengine", setServerList)
        //request_available_servers()
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
    <div id="server_main" style={componentStyle}>
        <div id="server_header">
            <img id='server_header_logo' src={icon_server} alt=""/>
            <div id='server_header_name'>CE SERVER</div>
        </div>
        <div id="server_body">
            {/* <div className="database_elem"/> */}
        </div>
        <div id="server_request_button">
            <img id="server_request_button_logo" onClick={handleRequestServers} src={icon_server_request_button} alt="" title={"Checks for new available servers."}/>
        </div>
    </div>
    );
}

export default Server;
