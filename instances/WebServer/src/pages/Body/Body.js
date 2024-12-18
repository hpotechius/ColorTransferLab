/*
Copyright 2024 by Herbert Potechius,
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

/*-----------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------
-- 
-------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------*/
function Body(props) {
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    const icon_body_source_button = "assets/icons/icon_source.png";
    const icon_body_reference_button = "assets/icons/icon_reference.png";
    const icon_body_output_button = "assets/icons/icon_output.png";

    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        setMobileMaxWidth(String(styles.getPropertyValue('--mobile-max-width')).trim());
      }, []); // Only re-run the effect if count changes



    let bodyStyle = {};
    let bodyMainStyle = {};
    let sourceStyle = {};
    let referenceStyle = {};
    let referenceMainStyle = {};
    let outputStyle = {};
    let renderSelectionStyle = {};
    if (window.innerWidth < mobileMaxWidth) {
        renderSelectionStyle = { display: "block"};
        bodyStyle = { left: "0px", width: "calc(100% - 6px)", height: "calc(100% - 304px)", margin: "2px"}
        bodyMainStyle = { margin: "0px", width: "calc(100%)", height: "calc(100%)"};
        sourceStyle = {width:"calc(100%)", height:"calc(100%)", display: "block"};
        referenceMainStyle = {top:"0px", width:"calc(100%)", height:"calc(100%)", display: "none"};
        referenceStyle = {width:"calc(100%)", height:"calc(100%)"};
        outputStyle = {left: "0px", width:"calc(100%)", height:"calc(100%)", display: "none"};
    }
    else{
        $("#body_menu").css("display", "none");
        
        if(props.singleView) {
            renderSelectionStyle = { display: "block"};
            bodyStyle = {width: "calc(100% - 406px)", left:"200px", height: "calc(100% - 306px)", margin: "2px"}
            bodyMainStyle = { margin: "0px", width: "calc(100%)", height: "calc(100%)"};
            sourceStyle = {width:"calc(100%)", height:"calc(100%)", display: "block"};
            referenceMainStyle = {top:"0px", width:"calc(100%)", height:"calc(100%)", display: "none"};
            referenceStyle = {width:"calc(100%)", height:"calc(100%)"};
            outputStyle = {left: "0px", width:"calc(100%)", height:"calc(100%)", display: "none"};
        }
    }

    function showSource() {
        $("#renderer_src").css("display", "block");
        $("#rendererref_main").css("display", "none");
        $("#renderer_out").css("display", "none");
    }  
    
    function showReference() {
        $("#renderer_src").css("display", "none");
        $("#rendererref_main").css("display", "block");
        $("#renderer_out").css("display", "none");
    }

    function showOutput() {
        $("#renderer_src").css("display", "none");
        $("#rendererref_main").css("display", "none");
        $("#renderer_out").css("display", "block");
    }



    function showMenus(active_menus) {
        const menu_list = ["#server_main", "#algorithms_main", "#body_menu", "#settings_main", "#dbserver_main","#database_main", "#items_main", 
        "#body_source_button", "#body_reference_button", "#body_output_button", "#body_preview",
        "#renderer_src", "#rendererref_main", "#renderer_out"]

        for(let i = 0; i < menu_list.length; i++)
            $(menu_list[i]).css("display", "none")
        for(let i = 0; i < active_menus.length; i++)
            $(active_menus[i]).css("display", "block")
    }

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
                    {/* <div className='body_button' id="body_server_button" onClick={() => showMenus(["#server_main"])}>
                        Server
                    </div> */}
                    <div className='body_button' id="body_settings_button" onClick={() => showMenus(["#settings_main"])}>
                        Settings
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Body;