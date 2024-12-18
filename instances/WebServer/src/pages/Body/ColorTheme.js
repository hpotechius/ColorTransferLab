/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useEffect, useRef } from "react";
import $ from 'jquery';
import './ColorTheme.scss';


export let color_palette = []

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function ColorTheme(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const numcolors = useRef(0)

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        // remove all children
        const element = document.getElementById(props.id);
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
        createColorPickerButton(props.id)

    }, [props.id]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    function addColor(cp_btn, colorpick, ID){
        numcolors.current += 1
        // console.log(colorpick.value)
        color_palette.push(colorpick.value)
        // console.log(color_palette)
        $(cp_btn).html(colorpick.value)
        $(cp_btn).css("background-color", colorpick.value);
        $(cp_btn).css("color", "#FFFFFF");
        $(cp_btn).css("text-shadow", "0px 0px 5px #000000");
        $(colorpick).css("visibility", "hidden");


        $(cp_btn).data("active", "yes")

        if(numcolors.current >= 20) {
            return
        }

        createColorPickerButton(ID)
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    function removeButton(cp_btn, ID) {
        if($(cp_btn).data("active") !== "no"){
            $(cp_btn).remove()
            // remove element from array
            let new_color_palette = []
            let i = 0
            // if an element is deleted this boolean is set to true
            // if an element has the same value as the deleted one, the element will be kept
            let deletedOnce = false
            while (i < color_palette.length) {
                if(color_palette[i] !== $(cp_btn).html() || deletedOnce === true)
                    new_color_palette.push(color_palette[i])
                else if (color_palette[i] === $(cp_btn).html())
                    deletedOnce = true
                i++;
            }
            color_palette = new_color_palette
            console.log(color_palette)
            // console.log($(cp_btn).html())
            // color_palette
            if(numcolors.current >= 20) {
                createColorPickerButton(ID)
            }
            numcolors.current -= 1
        }
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    function createColorPickerButton(ID) {
        var cp_btn = document.createElement("div")

        var colorpick = document.createElement("input")
        $(colorpick).addClass("colorpicker_button_img").attr("type", "color").appendTo($(cp_btn)).on("change", function(){addColor(cp_btn, colorpick, ID)})

        $(cp_btn).data("active", "no")
        $(cp_btn).addClass("colorpicker_button").appendTo($("#" + ID)).on("click", function(){removeButton(cp_btn, ID)})
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id}/>
    );
}

export default ColorTheme;