/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useState, useEffect } from "react";
import $ from 'jquery'
import "./TabButton.scss";


function TabButton(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
     const [componentStyle, setComponentStyle] = useState({});
     const [field, setField] = useState(null);

    /**************************************************************************************************************
     * Update the style of the sidebarright component depending on the window width.
     * Full width for mobile devices and normal width (~200px) for desktop devices.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                //setComponentStyle({ width: "calc(100%)", height: "calc(100% - 300px)", left: "0px" });
                setField(<img className="console_icons" alt="" src={props.iconPath}/>);
            } else {
                setField(props.children);
            }
        };

        // sets the terminal as the default active menu with lightgrey background color
        if(props.defaultActive)
            setComponentStyle({backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor')})

        updateComponentStyle();
        window.addEventListener('resize', updateComponentStyle)

        return () => {
            window.removeEventListener('resize', updateComponentStyle);
        };
    }, []);
    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    function showMenus(active_menus, event) {
        const menu_list = [
            "#console_terminal", 
            "#console_evaluation", 
            "#console_configuration", 
            "#console_histogram", 
            "#console_information"]

        for(let i = 0; i < menu_list.length; i++)
            $(menu_list[i]).css("display", "none")
        for(let i = 0; i < active_menus.length; i++)
            $(active_menus[i]).css("display", "block")

        $(".console_header_element").css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--headercolor'))
        // change the background color of the clicked tab header element
        $(event.currentTarget).css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor'));
    }


    return (
        <div title={props.title} style={componentStyle} className="console_header_element" onClick={(event) => showMenus(["#"+props.menuID], event)}>
            {field}
        </div>
    );
}

export default TabButton;