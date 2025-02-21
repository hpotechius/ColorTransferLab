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

import Histogram from './Histogram';
import Evaluation from './Evaluation';
import Terminal from './Terminal';
import Configuration from './Configuration';
import Information from './Information';
import {evalPrint, exportMetrics, pathjoin, getRandomID, consolePrint} from 'Utils/Utils'
import {active_reference} from "pages/Body/Body"
import {color_palette} from "pages/Body/ColorTheme"
import TabButton from './TabButton';
import ExecutionButton from "./ExecutionButton";
import {execution_data, WebRTCConnection, available_methods} from 'Utils/System'
import './Console.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Console() {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [componentStyle, setComponentStyle] = useState({});
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    const icon_play_button = "assets/icons/icon_play.png";
    const icon_eval_button = "assets/icons/icon_eval.png";
    const icon_export_metric_button = "assets/icons/icon_export_metric.png";
    const icon_terminal_button = "assets/icons/icon_terminal.png";
    const icon_evaluation_button = "assets/icons/icon_evaluation.png";
    const icon_configuration_button = "assets/icons/icon_configuration.png";
    const icon_colorstats_button = "assets/icons/icon_colorstats.png";
    const icon_information_button = "assets/icons/icon_information.png";

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
        setMobileMaxWidth(mobileMaxWidth);
        const updateComponentStyle = () => {
            if (window.innerWidth < mobileMaxWidth2) {
                setComponentStyle({ left: "0px", width: "calc(100% - 6px)"});
            } else {
                setComponentStyle({});
            }
        };

        updateComponentStyle();
        window.addEventListener('resize', updateComponentStyle);

        $("#console_play_button").on("click", function(){handleClickPlay()})

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
     * Sends a request to the server to apply the selected color transfer algorithm.
     **************************************************************************************************************/
    function handleClickPlay() {
        const idx = Object.keys(available_methods).find(index => available_methods[index]["key"] === execution_data["approach"]);

        // save the reference value to restore it later
        // Only necessary for colorization
        const ref_temp = execution_data["reference"]

        // transfer type: colorization, color transfer, style transfer
        let transfer_type = ""
        if (execution_data["approach"] !== "")
            transfer_type = available_methods[idx]["type"]
        
        if (transfer_type === "Colorization") {
            // set reference to source if colorization is selected
            // has to be reversed later
            execution_data["reference"] = execution_data["source"]
        }

        // check if a Single Input Reference or a Color Theme Reference is selected
        let ref_val
        if(active_reference === "Single Input")
            ref_val = execution_data["reference"]
        else if(active_reference === "Color Theme")
            ref_val = color_palette

        // determine source data type
        const source_ext = execution_data["source"].split('.').pop()
        let source_type
        if (source_ext === "png")
            source_type = "Image"
        else if (source_ext === "ply")
            source_type = "PointCloud"
        else if (source_ext === "mesh")
            source_type = "Mesh"
        else if (source_ext === "mp4")
            source_type = "Video"
        else if (source_ext === "lf")
            source_type = "LightField"
        else if (source_ext === "volu")
            source_type = "VolumetricVideo"
        else if (source_ext === "gsp")
            source_type = "GaussianSplatting"
        else{
            consolePrint("WARNING", "The selected source file type is not supported yet.")
            // TEMPORARY
            const out_dat = {
                "command": "/test",
                "data": "x".repeat(1024 * 10)
            }
            WebRTCConnection.sendMessage(JSON.stringify(out_dat))
            return
        }

        let reference_type
        if(active_reference === "Single Input") {
            const reference_ext = execution_data["reference"].split('.').pop()
            if (reference_ext === "png")
                reference_type = "Image"
            else if (reference_ext === "ply")
                reference_type = "PointCloud"
            else if (reference_ext === "mesh")
                reference_type = "Mesh"
            else if (reference_ext === "mp4")
                reference_type = "Video"
            else if (reference_ext === "lf")
                reference_type = "LightField"
            else if (reference_ext === "volu")
                reference_type = "VolumetricVideo"
            else if (reference_ext === "gsp")
                reference_type = "GaussianSplatting"
            else{
                // if(transfer_type !== "Colorization"){
                consolePrint("WARNING", "The selected reference file type is not supported yet.")
                return
                // } else {
                //     // set reference type to image if the selected approach is colorization in order to bypass the compatibility check
                //     reference_type = "Image"
                // }
            }
        } else {
            reference_type = "Image"
        }

        // Check if the selected approach is compatible with the selected source and reference
        const supported_datatypes = available_methods[idx]["datatypes"]
        if (!supported_datatypes.includes(source_type) || !supported_datatypes.includes(reference_type)) {
            consolePrint("WARNING", "The selected approach is not compatible with the selected source and reference.")
            return
        }


        // TEMPORARY: If the gaussian splatting is in .ply or ksplat format, color transfer is not possible
        if (execution_data["source"].includes("-ksplat") || execution_data["reference"].includes("-ksplat") || execution_data["source"].includes("-ply") || execution_data["reference"].includes("-ply")) {
            consolePrint("WARNING", "Color Transfer of Gaussian Splatting in .ply and .ksplat format is not supported yet.")
            return
        }

        // TEMPORARY: Color Transfer with reference (Video, LightField, VolumetricVideo) is not supported yet
        if (execution_data["reference"].includes(".mp4") || execution_data["reference"].includes(".lf") || execution_data["reference"].includes(".volu")) {
            consolePrint("WARNING", "Color Transfer with reference (Video, LightField, VolumetricVideo) is not supported yet")
            return
        }

        // check if source object, reference object and approach are selected
        if(execution_data["source"] !== "" && ref_val !== "" && execution_data["approach"] !== "" ||
            execution_data["source"] !== "" && execution_data["approach_type"] === "Colorization"
        ) {
            console.debug("%c[INFO] Apply Color Transfer Approach:", "color: orange;", execution_data["approach"])
            consolePrint("INFO", "Apply " + execution_data["approach"])

            // shows a loading screen while executing the selected algorithm
            const view_loadingID = "view_loading_renderer_out"
            $(`#${view_loadingID}`).css("display", "block")

            // output file has to be saved with a random name, otherwise the browser loads the cached object
            var rankey = getRandomID()
            // uses the generated key as output name
            execution_data["output"] = pathjoin("Output", rankey)

            const out_dat = {
                "command": "/color_transfer",
                "data": {
                    "source": execution_data["source"],
                    "reference": {
                        "type": active_reference,
                        "value": ref_val
                    },
                    "output": execution_data["output"],
                    "approach": execution_data["approach"],
                    "options": execution_data["options"]
                }
            }

            if (transfer_type === "Colorization") {
                // set reference back to the original value
                execution_data["reference"] = ref_temp
            }

            console.debug("%c[SEND] WebRTC Request to Database: Apply Color Transfer:", "color: lightgreen;", out_dat)
            WebRTCConnection.sendMessage(JSON.stringify(out_dat))
        } else {
            consolePrint("WARNING", "Input selection incomplete or no color transfer approach selected")

            // TEMPORARY
            const out_dat = {
                "command": "/test",
                "data": ""
            }
            WebRTCConnection.sendMessage(JSON.stringify(out_dat))
        }
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id='console_main' style={componentStyle}>
            {/* The console header contains clickable fields to switch between the terminal, evaluation, configuration, color histograms, and information. */}
            <div id="console_header">
                <TabButton 
                    iconPath={icon_terminal_button} 
                    defaultActive={true}
                    menuID={"console_terminal"}
                    title="Shows status messages and errors."
                >
                    Terminal
                </TabButton>
                <TabButton 
                    iconPath={icon_evaluation_button} 
                    menuID={"console_evaluation"}
                    title="Shows the evaluation results of the selected algorithm."
                >
                    Evaluation
                </TabButton>
                <TabButton 
                    iconPath={icon_configuration_button} 
                    menuID={"console_configuration"}
                    title='Set the parameters for the selected algorithm, such as color space and more'
                >
                    Configuration
                </TabButton>
                <TabButton 
                    iconPath={icon_colorstats_button} 
                    menuID={"console_histogram"}
                    title='Display the color histograms of the source, reference, and output images.'
                >
                    Histogram
                </TabButton>
                <TabButton 
                    iconPath={icon_information_button} 
                    menuID={"console_information"}
                    title='Display details about the selected algorithm, such as the year of publication, abstract, and more.'
                >
                    Information
                </TabButton>
            </div>

            {/* The console body contains the terminal, evaluation, configuration, color histograms, and information. */}
            <div id="console_body">
                <Terminal id="console_terminal"/>
                <Evaluation id="console_evaluation"/>
                <Configuration id="console_configuration"/>
                <Histogram id="console_histogram"/>
                <Information id="console_information"/>
            </div>

            {/* Buttons for uploading a photo, executing the color transfer and the evaluation. */}
            <div className="button-container">
                <ExecutionButton 
                    iconPath={icon_export_metric_button} 
                    onClick={exportMetrics}
                    title={"Export the evaluation results."}
                />
                <ExecutionButton 
                    iconPath={icon_eval_button} 
                    onClick={evalPrint}
                    title={"Apply multiple evaluaiton metrics on source, reference and output."}
                />
                <ExecutionButton 
                    iconPath={icon_play_button} 
                    onClick={handleClickPlay}
                    title={"Apply the selected algorithm."}
                />
            </div>
        </div>
    );
}

export default Console;
