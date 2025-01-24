/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useState, useEffect } from "react";
import $ from 'jquery';

import {consolePrint, setConfiguration, setInformation} from 'Utils/Utils'
import {execution_data} from 'Utils/System'
import './Algorithms.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** EXPORTED FUNCTIONS
 ******************************************************************************************************************
 ******************************************************************************************************************/

/******************************************************************************************************************
 ** Create the buttons for the color transfer, style transfer and colorization algorithms
 ******************************************************************************************************************/
export const createCTButtons = (stat_obj, options) => {
    $("#algorithms_content_colorTransfer").html("")
    $("#algorithms_content_styleTransfer").html("")
    $("#algorithms_content_colorization").html("")
    for (let elem of stat_obj){
        let containerID = ""
        if(elem["type"] === "Color Transfer")
            containerID = "#algorithms_content_colorTransfer"
        else if(elem["type"] === "Style Transfer")
            containerID = "#algorithms_content_styleTransfer"
        else if(elem["type"] === "Colorization")
            containerID = "#algorithms_content_colorization"

        var d = document.createElement('div');
        $(d).addClass("algorithms_approach").attr("title", elem["name"]).appendTo($(containerID))
        $(d).on("click", function(){activate_color_transfer(elem, options)});

        // create light icons for each available data type -> and dark icons for unavailable data types
        let icon_pos_right = 5;
        for(let type of ["Image", "Mesh", "PointCloud", "Video", "VolumetricVideo", "LightField", "GaussianSplatting"]){
            let icon_available;
            var icon_availability_yes;
            var icon_availability_no;

            if(type === "Image") {
                icon_availability_yes = "assets/icons/icon_image_available.png"
                icon_availability_no = "assets/icons/icon_image_available_no.png"
            }
            else if (type === "PointCloud") {
                icon_availability_yes = "assets/icons/icon_cloud_available_yes.png"
                icon_availability_no = "assets/icons/icon_cloud_available_no.png"
            }
            else if (type === "Mesh") {
                icon_availability_yes = "assets/icons/icon_mesh_available_yes.png"
                icon_availability_no = "assets/icons/icon_mesh_available_no.png"
            }
            else if (type === "Video") {
                icon_availability_yes = "assets/icons/icon_video_available_yes.png"
                icon_availability_no = "assets/icons/icon_video_available_no.png"
            }
            else if (type === "VolumetricVideo") {
                icon_availability_yes = "assets/icons/icon_voluvideo_available_yes.png"
                icon_availability_no = "assets/icons/icon_voluvideo_available_no.png"
            }
            else if (type === "LightField") {
                icon_availability_yes = "assets/icons/icon_lightfield_available_yes.png"
                icon_availability_no = "assets/icons/icon_lightfield_available_no.png"
            }
            else if (type === "GaussianSplatting") {
                icon_availability_yes = "assets/icons/icon_gaussian_available_yes.png"
                icon_availability_no = "assets/icons/icon_gaussian_available_no.png"
            }
            else {
                icon_availability_yes = "assets/icons/icon_availability_yes.png"
                icon_availability_no = "assets/icons/icon_availability_no.png"
            }
            if(elem["datatypes"].includes(type))
                icon_available = icon_availability_yes
            else
                icon_available = icon_availability_no
            
            var d_icon = document.createElement('img');
            $(d_icon).addClass("algorithms_item_icon").attr("src", icon_available).appendTo($(d)).css("right", icon_pos_right.toString() + "px")
            icon_pos_right += 15
        }

        var d_text = document.createElement('div');
        $(d_text).addClass("algorithms_item_text").html(elem["key"]).appendTo($(d))
    }
}

/******************************************************************************************************************
 ** By clicking on one color transfer button, the correpsonding approach will be activated by calling the
 ** activate_color_transfer()-method
 ******************************************************************************************************************/
export const activate_color_transfer = (param, options) => {
    console.debug("%c[INFO] Change active method to:", "color: orange;", param)
    execution_data["approach"] = param["key"]
    execution_data["approach_type"] = param["type"]
    execution_data["options"] = options[param["key"]]
    consolePrint("INFO", "Set Color Transfer Algorithm to: " + param["key"] )

    setInformation(param);
    setConfiguration(options[param["key"]]);
}

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Algorithms(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);
    const [componentStyle, setComponentStyle] = useState({});

    const icon_algorithms = "assets/icons/icon_algorithm_grey.png";
    const icon_colortransfer_button = "assets/icons/icon_colortransfer.png";
    const icon_segmentation_button = "assets/icons/icon_segmentation.png";
    const icon_classification_button = "assets/icons/icon_classification.png";
    const sidebar_algorithms = "ALGORITHMS"

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
        const mobileMaxWidth2 = String(styles.getPropertyValue('--mobile-max-width')).trim();
        setMobileMaxWidth(mobileMaxWidth2);
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth2) {
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
     * Switch the active menu
     * (1) Color Transfer
     * (2) Style Transfer
     * (3) Colorization
     **************************************************************************************************************/
    function showMenus(active_menus, event) {
        const menu_list = ["#algorithms_content_colorTransfer", "#algorithms_content_styleTransfer", "#algorithms_content_colorization"]

        for(let i = 0; i < menu_list.length; i++)
            $(menu_list[i]).css("display", "none")
        for(let i = 0; i < active_menus.length; i++)
            $(active_menus[i]).css("display", "block")

        // 
        $("#SideBarLeft_sidebarleft").css("display", "block")
        
        $(".algorithms_menu_item").css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--headercolor'))
        $(event.currentTarget).css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor'));
    }
    
    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id="algorithms_main" style={componentStyle}>
            <div id="algorithms_header">
                <img id="algorithms_header_logo" src={icon_algorithms} alt=""/>
                <div id="algorithms_header_name">{sidebar_algorithms}</div>
            </div>

            <div id="algorithms_menu">
                <div className="algorithms_menu_item" id="algorithms_menu_colorTransfer" onClick={(event) => showMenus(["#algorithms_content_colorTransfer"], event)} style={{backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor')}}>
                    {window.innerWidth < mobileMaxWidth ? <img className="algorithms_icons" alt="" src={icon_colortransfer_button}/> : <div className="algorithms_menu_item_text">Color Transfer</div>}
                </div>

                <div className="algorithms_menu_item" id="algorithms_menu_styleTransfer" onClick={(event) => showMenus(["#algorithms_content_styleTransfer"], event)}>
                {window.innerWidth < mobileMaxWidth ? <img className="algorithms_icons" alt="" src={icon_segmentation_button}/> : <div className="algorithms_menu_item_text">Style Transfer</div>}
                </div>

                <div className="algorithms_menu_item" id="algorithms_menu_colorization" onClick={(event) => showMenus(["#algorithms_content_colorization"], event)}>
                {window.innerWidth < mobileMaxWidth ? <img className="algorithms_icons" alt="" src={icon_classification_button}/> : <div className="algorithms_menu_item_text">Colorization</div>}
                </div>
            </div>

            <div className="algorithms_list" id="algorithms_content_colorTransfer">
                <span style={{"color":"grey"}} className="temp_algos">Please select a server instance to enable this service.</span>
            </div>
            <div className="algorithms_list" id="algorithms_content_styleTransfer">
                <span style={{"color":"grey"}} className="temp_algos">Please select a server instance to enable this service.</span>
            </div>
            <div className="algorithms_list" id="algorithms_content_colorization">
                <span style={{"color":"grey"}} className="temp_algos">Please select a server instance to enable this service.</span>
            </div>
        </div>
    );
}

export default Algorithms;