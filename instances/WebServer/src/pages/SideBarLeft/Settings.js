/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect, useRef} from "react";
import './Settings.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Settings(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});

    const icon_settings = "assets/icons/icon_settings_grey.png";
    const sidebar_settings = "SETTINGS"

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Update the style of the sidebarright component depending on the window width.
     * Full width for mobile devices and normal width (~200px) for desktop devices.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                setComponentStyle({ display: "none", width: "calc(100% - 6px)", top: "0px", height: "calc(100% - 6px)" });
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
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
    <div id="settings_main" style={componentStyle}>
        <div id="settings_header">
        <img id='settings_header_logo' src={icon_settings} alt=""/>
        <div id='settings_header_name'>{sidebar_settings}</div>
        </div>
        <div id="settings_body">
        <table style={{width:"100%"}}>
            <tbody>
            <tr>
                <td className="settings_table_cell">Single View</td>
                <td>
                    <input 
                        id="settings_singleview" 
                        type="checkbox"
                        onChange={(e) => {
                            props.setSingleView(e.target.checked);
                            console.log("Single View: " + e.target.checked);
                            //window.dispatchEvent(new Event('resize'));
                        }}
                    />
                </td>
            </tr> 
            {/* <tr>
                <td>RGB Color Space</td>
                <td><input id="settings_rgbcolorspace" type="checkbox" /></td>
            </tr>
            <tr>
                <td>3D RGB Color Histogram</td>
                <td><input id="settings_3dcolorhistogram" type="checkbox" /></td>
            </tr> */}
            {/* <tr>
                <td>Voxel Grid</td>
                <td><input id="settings_voxelgrid" type="checkbox" /></td>
            </tr>
            <tr>
                <td title={"The objects have to be loaded manually again for showing the new voxel level."}>Voxel Level</td>
                <td><input id="settings_voxellevel" type="range" min="1" max="3" defaultValue="1" style={{width: "75px"}}/></td>
            </tr> */}
            </tbody>
        </table>
        </div>
    </div>
    );
}

export default Settings;