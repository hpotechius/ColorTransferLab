/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React from 'react';
import { useState, useEffect, useRef } from "react";
import $ from 'jquery';
import './Items.scss';
import {consolePrint} from 'Utils/Utils';

/*-----------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------
-- Contains the items which will be shown after clicking an element in the DATABASE window
-------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------*/
function Items(props) {
    const icon_items = "assets/icons/icon_frames_grey.png";
    const icon_return = "assets/icons/icon_arrow_left.png";

    const icon_preview_button = "assets/icons/icon_preview.png";
    const sidebar_items = "ITEMS"

    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        setMobileMaxWidth(String(styles.getPropertyValue('--mobile-max-width')).trim());
    }, []);

    let componentStyle = {};
    let returnButtonStyle = {};
    if (window.innerWidth < mobileMaxWidth) {
        componentStyle = { display: "none", width: "calc(100% - 6px)", top: "0px", height: "calc(100% - 4px)"};
        returnButtonStyle = {display:"block"}
    }

    function showPreviews() {
        // only show the preview field if items are in the items list
        if($("#items_body").children().length == 0) {
            consolePrint("WARNING", "Itemslist is empty ...")
            return
        }
        
        if($("#body_preview").css("display") == "none")
            $("#body_preview").css("display", "flex")
        else
            $("#body_preview").css("display", "none")
    }

    // Info: the corresponing button is only shown in mobile mode
    // hide the items window and show the database window
    function returnToDatabase() {
        $("#items_main").css("display", "none")
        $("#database_main").css("display", "block")
        $("#body_preview").css("display", "none")
    }
    
    return (
        <div id="items_main" style={componentStyle}>
            <div id="items_header">
                <img id='items_header_logo' src={icon_items}/>
                <div id='items_header_name'>{sidebar_items}</div>
                <div className='items_preview_button' onClick={showPreviews}>
                    <img className="items_preview_icon" src={icon_preview_button}/>
                </div>
                <div id='items_return_button' onClick={returnToDatabase} style={returnButtonStyle}>
                    <img id="items_return_icon" src={icon_return}/>
                </div>
            </div>
            <div id="items_body"/>
        </div>
    );
}

export default Items;