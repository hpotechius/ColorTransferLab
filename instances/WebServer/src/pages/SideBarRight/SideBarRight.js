/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useState, useEffect } from "react";
// import Settings from './Settings'
import Server from './Server'
import Database from './Database'
import Items from './Items'
import './SideBarRight.scss';
import DatabaseServer from "./DatabaseServer";


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function SideBarRight(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Defines the maximum width of the mobile device.
     * This value is read from the CSS variable "--mobile-max-width" in the settings/Global.scss file.
     **************************************************************************************************************/
    useEffect(() => {

    }, []);

    /**************************************************************************************************************
     * Update the style of the sidebarright component depending on the window width.
     * Full width for mobile devices and normal width (~200px) for desktop devices.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                setComponentStyle({ width: "calc(100%)", height: "calc(100% - 300px)", left: "0px" });
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
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id="SideBarRight_sidebarright" style={componentStyle}>  
            <Database/> 
            <Items/> 
            <DatabaseServer/>
            {/* <Server/> */}
            {/* <Settings setSingleView={props.setSingleView}/> */}
        </div>
    );
  }

export default SideBarRight;