/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useEffect, useState } from 'react';
import $ from 'jquery';

import Renderer from './Renderer';
import ColorTheme from './ColorTheme';
import PreviewBoard from './PreviewBoard';
import 'settings/Global.scss';
import './Body.scss';

export let active_reference = "Single Input"

export const setReferenceWindow = (tab) => {
    if(tab === "Single Input" || tab === "Color Theme")
        active_reference = tab
}

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Renderer: Source, Reference, Output
 ******************************************************************************************************************
 ******************************************************************************************************************/
const Body = (props) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);
    const [bodyStyle, setBodyStyle] = useState({});
    const [bodyMainStyle, setBodyMainStyle] = useState({});
    const [sourceStyle, setSourceStyle] = useState({});
    const [referenceStyle, setReferenceStyle] = useState({});
    const [referenceMainStyle, setReferenceMainStyle] = useState({});
    const [outputStyle, setOutputStyle] = useState({});
    const [renderSelectionStyle, setRenderSelectionStyle] = useState({});

    const icon_body_source_button = "assets/icons/icon_source.png";
    const icon_body_reference_button = "assets/icons/icon_reference.png";
    const icon_body_output_button = "assets/icons/icon_output.png";

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Update the style of the console component depending on the window width and the single view mode.
     * Either Mobile or Desktop view.
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        const mobileMaxWidth2 = String(styles.getPropertyValue('--mobile-max-width')).trim();
        setMobileMaxWidth(mobileMaxWidth2);

        // Hide the menu in single view mode.
        $("#body_menu").css("display", "none");

        if (window.innerWidth < mobileMaxWidth2 || props.singleView) {
            if(window.innerWidth < mobileMaxWidth2 || props.singleView && window.innerWidth < mobileMaxWidth2)
                setBodyStyle({left: "0px", width: "calc(100% - 6px)", height: "calc(100% - 304px)", margin: "2px"});
            else
                setBodyStyle({width: "calc(100% - 406px)", left:"200px", height: "calc(100% - 306px)", margin: "2px"});
            setBodyMainStyle({margin: "0px", width: "calc(100%)", height: "calc(100%)"});
            setSourceStyle({width:"calc(100%)", height:"calc(100%)", display: "block"});
            setReferenceStyle({width:"calc(100%)", height:"calc(100%)"});
            setReferenceMainStyle({top:"0px", width:"calc(100%)", height:"calc(100%)", display: "none"});
            setOutputStyle({left: "0px", width:"calc(100%)", height:"calc(100%)", display: "none"});
            setRenderSelectionStyle({display: "block"});
        } else {
            setBodyStyle({});
            setBodyMainStyle({});
            setSourceStyle({});
            setReferenceStyle({});
            setReferenceMainStyle({});
            setOutputStyle({});
            setRenderSelectionStyle({});
        }
    }, [props.singleView, window.innerWidth]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Shows the source renderer in single view mode.
     **************************************************************************************************************/
    function showSource() {
        $("#renderer_src").css("display", "block");
        $("#rendererref_main").css("display", "none");
        $("#renderer_out").css("display", "none");
    }  
    
    /**************************************************************************************************************
     * Shows the reference renderer in single view
     **************************************************************************************************************/
    function showReference() {
        $("#renderer_src").css("display", "none");
        $("#rendererref_main").css("display", "block");
        $("#renderer_out").css("display", "none");
    }

    /**************************************************************************************************************
     * Shows the output renderer in single view
     **************************************************************************************************************/
    function showOutput() {
        $("#renderer_src").css("display", "none");
        $("#rendererref_main").css("display", "none");
        $("#renderer_out").css("display", "block");
    }

    /**************************************************************************************************************
     * Switch between the different menus in the body in single view mode.
     **************************************************************************************************************/
    function showMenus(active_menus) {
        const menu_list = ["#server_main", "#algorithms_main", "#body_menu", "#settings_main", "#dbserver_main","#database_main", "#items_main", 
        "#body_source_button", "#body_reference_button", "#body_output_button", "#body_preview",
        "#renderer_src", "#rendererref_main", "#renderer_out"]

        for(let i = 0; i < menu_list.length; i++)
            $(menu_list[i]).css("display", "none")
        for(let i = 0; i < active_menus.length; i++)
            $(active_menus[i]).css("display", "block")
    }

    /**************************************************************************************************************
     * Switch in the reference renderer between the single input and the color theme tab.
     **************************************************************************************************************/
    function showMenusRef(active_menus, tab, event) {
        setReferenceWindow(tab)
        const menu_list = ["#renderer_ref", "#colortheme"]

        for(let i = 0; i < menu_list.length; i++)
            $(menu_list[i]).css("display", "none")
        for(let i = 0; i < active_menus.length; i++)
            $(active_menus[i]).css("display", "block")

        $(".renderer_ref_header_elem").css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--headercolor'))
        $(event.currentTarget).css("background-color", getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor'));
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id='Body_body' style={bodyStyle}>
            <PreviewBoard id={"body_preview"}/>
            <div id="body_main" style={bodyMainStyle}>

                <Renderer id="renderer_src" title="Source" window="src" droppable={true} objInfo={{}} style={sourceStyle}/>

                <div id='rendererref_main' style={referenceMainStyle}>
                    <div id="renderer_ref_header">
                        <div className="renderer_ref_header_elem" id="renderer_ref_header_singleinput" onClick={(event) => showMenusRef(["#renderer_ref"], "Single Input", event)} style={{backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--backgroundcolor')}}>Single Input</div>
                        <div className="renderer_ref_header_elem" id="renderer_ref_header_colortheme" onClick={(event) => showMenusRef(["#colortheme"], "Color Theme" , event)}>Color Theme</div>
                    </div>
                    <div id="renderer_ref_body">
                        <Renderer id="renderer_ref" title="Reference" window="ref"  droppable={true} objInfo={{}} style={referenceStyle}/>
                        <ColorTheme id="colortheme"/>
                    </div>
                </div> 

                <Renderer id="renderer_out" title="Output" window="out" droppable={false} objInfo={{}} style={outputStyle}/>

                <div id="body_source_button" style={renderSelectionStyle}>
                    <img id="body_source_button_logo" alt="" onClick={showSource} src={icon_body_source_button} title={"Show source renderer."}/>
                </div>

                <div id="body_reference_button" style={renderSelectionStyle}>
                    <img id="body_reference_button_logo" alt="" onClick={showReference} src={icon_body_reference_button} title={"Show reference renderer."}/>
                </div>

                <div id="body_output_button" style={renderSelectionStyle}>
                    <img id="body_output_button_logo" alt="" onClick={showOutput} src={icon_body_output_button} title={"Show output renderer."}/>
                </div>

                <div id="body_menu">
                    <div className='body_button' id="body_renderer_button" onClick={() => showMenus(["#renderer_src", "#body_source_button", "#body_reference_button", "#body_output_button"])}>
                        Renderer
                    </div>
                    <div className='body_button' id="body_database_button" onClick={() => showMenus(["#dbserver_main"])}>
                        Compute Node
                    </div>
                    <div className='body_button' id="body_algorithms_button" onClick={() => showMenus(["#algorithms_main"])}>
                        Algorithms
                    </div>
                    <div className='body_button' id="body_settings_button" onClick={() => showMenus(["#settings_main"])}>
                        Settings
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Body;