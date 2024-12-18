/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect} from "react";
import Algorithms from './Algorithms'
import Settings from './Settings'
import './SideBarLeft.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** Contains tabs for the following module classes:
 ** (1) Color Transfer
 ** (2) Style Transfer
 ** (3) Colorization
 ******************************************************************************************************************
 ******************************************************************************************************************/
function SideBarLeft(props) {
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
     * Update the style of the console component depending on the window width.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth = String(styles.getPropertyValue('--mobile-max-width')).trim();
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth) {
                setComponentStyle({width: "calc(100%)", height: "calc(100% - 300px)"});
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
        <div className="sidebarleft" style={componentStyle}>  
            <Algorithms/> 
            {/* <Server/> */}
            <Settings setSingleView={props.setSingleView}/>
        </div>
    );
}

export default SideBarLeft;