/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useState, useEffect, useRef} from 'react';
import $ from 'jquery';

import {consolePrint} from 'Utils/Utils';
import {execution_data} from 'Utils/System'
import ImageRenderer from 'pages/Body/ImageRenderer'
import VideoRenderer from 'pages/Body/VideoRenderer'
import MeshRenderer from 'pages/Body/MeshRenderer'
import LightFieldRenderer from 'pages/Body/LightFieldRenderer'
import RenderBar from './RenderBar';
import LoadingView from './LoadingView';
import GaussianSplatRenderer from './GaussianSplatRenderer';
import RendererButton from 'pages/Body/RendererButton';
import './Renderer.scss';
import { WebRTCConnection } from 'Utils/System';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** EXPORTED FUNCTIONS
 ******************************************************************************************************************
 ******************************************************************************************************************/

/**************************************************************************************************************
 * 
 **************************************************************************************************************/
export const active_reference = "Single Input"

/**************************************************************************************************************
 * Description of the <data_config> object
 * rendering -> contains the current render object
 **************************************************************************************************************/
// export const data_config = {}
// for(let renderer_obj of ["Source", "Reference", "Output"]) {
//     data_config[renderer_obj] = {
//         "filename": null,
//         "rendering": [],
//         "mesh": null,
//         "3D_color_histogram": null,
//         "3D_color_distribution": null,
//         "voxel_grid": null,
//         "pc_center": null,
//         "pc_scale":null
//     }
// }

/**************************************************************************************************************
 * Shows either the 2D or 3D renderer
 **************************************************************************************************************/
export const showView = (imageID, videoID, renderCanvasID, view_lightfieldID, view_emptyID, view) => {
    $("#" + view_emptyID).css("display", "none")
    if(view === "3D") {
        $("#" + imageID).css("visibility", "hidden")
        $("#" + videoID).css("visibility", "hidden")
        $("#" + renderCanvasID).css("display", "block")
        $("#" + view_lightfieldID).css("display", "none")
        // stop the video if it is still running
        try { $("#" + videoID).children("video").get(0).pause(); }
        catch (error) {}
    } else if(view === "video") {
        $("#" + imageID).css("visibility", "hidden")
        $("#" + videoID).css("visibility", "visible")
        $("#" + renderCanvasID).css("display", "none")
        $("#" + view_lightfieldID).css("display", "none")
    } else if(view === "lightfield") {
        $("#" + imageID).css("visibility", "hidden")
        $("#" + videoID).css("visibility", "hidden")
        $("#" + renderCanvasID).css("display", "none")
        $("#" + view_lightfieldID).css("display", "block")
    } else {
        $("#" + imageID).css("visibility", "visible")
        $("#" + videoID).css("visibility", "hidden")
        $("#" + renderCanvasID).css("display", "none")
        $("#" + view_lightfieldID).css("display", "none")
        // stop the video if it is still running
        try {
            $("#" + videoID).children("video").get(0).pause();
        }
        catch (error) {
        }
    }
}

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Renderer windows for (1) Source, (2) Reference and (3) Output
 ******************************************************************************************************************
 ******************************************************************************************************************/
const Renderer = (props) =>  {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    /* ------------------------------------------------------------------------------------------------------------
    -- IMPORTANT:
    -- This identifier can be either "src", "ref" or "out" and will be concatenated with ids of other
    -- components to create a unique identifier for each renderer.
    -------------------------------------------------------------------------------------------------------------*/
    const RID = props.window
    /* ------------------------------------------------------------------------------------------------------------
    -- STATE VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const [enableUpdate, changeEnableupdate] = useState(0)
    // stores if the object is completely loaded
    const [complete, setComplete] = useState(false)

    let [filePath_LightField, setFilePath_LightField] = useState(null)
    let [filePath_GaussianSplat, setFilePath_GaussianSplat] = useState(null)
    let [filePath_Image, setFilePath_Image] = useState(null)
    let [filePath_Video, setFilePath_Video] = useState(null)
    const [filePath_Mesh, setFilePath_Mesh] = useState(null)

    /* ------------------------------------------------------------------------------------------------------------
    -- REFERENCED VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    // Describes which data type is displayed
    // Possible values: ["", "Image", "PointCloud", "Mesh"]
    const mode = useRef("")
    // stores object information like: width, height, etc. 
    const objInfo = useRef(null)
    // stores the current mesh or pointcloud
    const mesh = useRef([])
    // stores the mesh for the 3D color histogram
    const histogram3D = useRef(null)
    const colorDistribution3D = useRef(null)
    const object3D = useRef(null)

    const obj_path = useRef("xxx")

    /* ------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const ID = props.id;
    const TITLE = props.title

    const imageID = "renderer_image" + ID
    const videoID = "renderer_video" + ID
    const innerImageID = "renderer_image_inner" + ID
    const innerVideoID = "renderer_video_inner" + ID
    const renderCanvasID = "renderer_canvas" + ID
    const view_lightfieldID = "view_lightfield_" + ID
    const view_gaussianSplat_ID = "view_gaussiansplat_" + ID
    const infoboxID = "renderer_info" + ID
    const renderBarID = "renderer_bar" + ID
    const view_loadingID = "view_loading_" + ID
    const view_emptyID = "view_empty_" + RID

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        // Callback function for the response of the file change
        // Only called if the variable "responseFile" has been changed
        if(WebRTCConnection !== null) {
            if(RID === "src")
                WebRTCConnection.onResponseSrcFileChange = (dataStruct) => {handleRenderFile(dataStruct)}
            else if(RID === "ref")
                WebRTCConnection.onResponseRefFileChange = (dataStruct) => {handleRenderFile(dataStruct)}
            else if(RID === "out")
                WebRTCConnection.onResponseOutFileChange = (dataStruct) => {handleRenderFile(dataStruct)}
        };
    }, [WebRTCConnection])

    /**************************************************************************************************************
     * Registration of EventListener
     **************************************************************************************************************/
    useEffect(() => {
        if(props.droppable) {
            $("#" + ID).on("dragover", function(e) {e.preventDefault();})
            $("#" + ID).on("drop", (e) => {drop_method(e.originalEvent)})
            $("#" + ID).on("itemClicked", function(e, data){click_method(data)});
        }
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Callback function executed because Variable "responseFile" in WebRTCConnection has changed.
     * Update of the renderer with the new file.
     **************************************************************************************************************/
    function handleRenderFile(dataStruct) {
        let value = dataStruct["data"]
        let file_type = dataStruct["type"]
        let abstr_file_path = dataStruct["abstractPath"]
        let rid = dataStruct["rid"]
        console.debug('%c[INFO] Callback function executed because Variable "responseFile" in WebRTCConnection has changed to:', "color: orange;", value);

        // check for object type
        // Images have the extensions "png" and "jpg"
        // Pointclouds have the extensions "obj" and "ply"
        // Meshes have the extension "obj" and a corresponding png texture has to exist
        if(file_type === "Image") {
            console.debug('%c[INFO] Handling Image File', "color: orange;");
            mode.current = "Image"
            // change the visibility of the image canvas only if the RGB color space button is not checked
            if(!$("#settings_rgbcolorspace").checked)
                switchView("Image")

            console.debug('%c[INFO] Convert ArrayBuffer to URLObject', "color: orange;",);
            // Value is already an Array of ArrayBuffers
            const receivedBlob = new Blob(value);
            const image_path = URL.createObjectURL(receivedBlob);
            console.debug('%c[INFO] Loading File ' + image_path, "color: orange;");
            setFilePath_Image(image_path)
            obj_path.current = abstr_file_path
        } else if(file_type === "Video") {
            console.debug('%c[INFO] Handling Video File', "color: orange;");
            mode.current = "Video"
            // change the visibility of the image canvas only if the RGB color space button is not checked
            if(!$("#settings_rgbcolorspace").checked)
                switchView("Video")

            console.debug('%c[INFO] Convert ArrayBuffer to URLObject', "color: orange;",);
            // Convert Array Buffer to Blob and then to URL Object
            const receivedBlob = new Blob(value);
            const video_path = URL.createObjectURL(receivedBlob);
            console.debug('%c[INFO] Loading File ' + video_path, "color: orange;");
            setFilePath_Video(video_path)
            obj_path.current = abstr_file_path
        } else if(file_type === "PointCloud") {
            console.debug('%c[INFO] Handling PointCloud File', "color: orange;");
            mode.current = "PointCloud"

            // Convert Array Buffer to Blob and then to URL Object
            const receivedBlob = new Blob(value);
            const filepath = URL.createObjectURL(receivedBlob);
            console.debug('%c[INFO] Loading File ' + filepath, "color: orange;");
            setFilePath_Mesh(filepath)
            obj_path.current = abstr_file_path
            switchView("Mesh")
        } else if(file_type === "Mesh") {
            console.debug('%c[INFO] Handling Mesh File', "color: orange;");
            mode.current = "Mesh"

            // contains paths to the obj, png and the mtl file
            let meshObj_paths = []
            for (const item of value) {
                const receivedBlob = new Blob([item]);
                const meshObj_path = URL.createObjectURL(receivedBlob);
                meshObj_paths.push(meshObj_path)
            }

            console.debug('%c[INFO] Loading File ' + meshObj_paths, "color: orange;");
            setFilePath_Mesh(meshObj_paths)
            obj_path.current = abstr_file_path
            switchView("Mesh")
        } else if(file_type === "GaussianSplatting") {
            console.debug('%c[INFO] Handling Gaussian Splatting File', "color: orange;");
            mode.current = "GaussianSplatting"
            const receivedBlob = new Blob(value);
            const gaussiansplat_path = URL.createObjectURL(receivedBlob);
            const real_ext = abstr_file_path.split("-").pop()
            console.debug('%c[INFO] Loading File ' + gaussiansplat_path + "." + real_ext, "color: orange;");
            setFilePath_GaussianSplat(gaussiansplat_path + "." + real_ext)
            obj_path.current = abstr_file_path
            switchView("GaussianSplat")
        } else if(file_type === "VolumetricVideo") {
            console.debug('%c[INFO] Handling Volumetric Video File', "color: orange;");
            mode.current = "VolumetricVideo"

            // contains paths to the obj, png and the mtl file
            let voluObj_paths = []
            for (const item of value) {
                const receivedBlob = new Blob([item]);
                const volu_path = URL.createObjectURL(receivedBlob);
                console.log(volu_path)
                voluObj_paths.push(volu_path)
            }

            console.debug('%c[INFO] Loading File ' + voluObj_paths, "color: orange;");
            setFilePath_Mesh(voluObj_paths)
            obj_path.current = abstr_file_path
            switchView("Mesh")
        } else if(file_type === "LightField") {
            console.debug('%c[INFO] Handling LightField File', "color: orange;");
            mode.current = "LightField"
            
            // contains paths to the json and the mp4 file
            let lightFieldObj_paths = []
            for (const item of value) {
                const receivedBlob = new Blob([item]);
                const lightfield_path = URL.createObjectURL(receivedBlob);
                console.log(lightfield_path)
                lightFieldObj_paths.push(lightfield_path)
            }

            console.debug('%c[INFO] Loading File ' + lightFieldObj_paths, "color: orange;");
            setFilePath_LightField(lightFieldObj_paths)
            switchView("LightField")
            obj_path.current = abstr_file_path
        }

        // set the execution parameters
        if(rid === "src") {
            console.debug('%c[INFO] Set source as:', 'color: orange', obj_path.current)
            execution_data["source"] = obj_path.current
        }
        else if(rid === "ref") {
            console.debug('%c[INFO] Set reference as:', 'color: orange', obj_path.current)
            execution_data["reference"] = obj_path.current
        }
    
    }

    /**************************************************************************************************************
     * This method is called when the user drops a file from the Items-Menu on the renderer.
     * Note:
     * Content of data:
     * E.g. data = /Meshes/GameBoy_medium:GameBoy_medium.obj
     * I.e. <path_to_file>:<file>
     **************************************************************************************************************/
    function drop_method(event) {
        event.preventDefault();
        var data = event.dataTransfer.getData('text');
        console.debug("%c[INFO] File dropped in Renderer: ", "color: orange", {"string":data})
        var [file_path, file_name_with_ext] = data.split(":")
        var [file_name, file_ext] = file_name_with_ext.split(".")
        updateRenderer(file_path, file_name, file_name_with_ext, file_ext)
    }

    /**************************************************************************************************************
     * This method is called when the user selects the Source- or the Reference-Button on the Items-Menu.
     * Note:
     * Content of data:
     * E.g. data = /Meshes/GameBoy_medium:GameBoy_medium.obj
     * I.e. <path_to_file>:<file>
     **************************************************************************************************************/
    function click_method(data) {
        var [file_path, file_name_with_ext] = data.split(":")
        var [file_name, file_ext] = file_name_with_ext.split(".")
        console.log("DATA: ", data)
        updateRenderer(file_path, file_name, file_name_with_ext, file_ext)
    }

    /**************************************************************************************************************
     * Will be executed when user drops a file on the renderer or selects a file from the Items-Menu.
     * Sends a request to the compute node to get the file.
     **************************************************************************************************************/
    function updateRenderer(file_path, file_name, file_name_with_ext, file_ext) {
        console.debug("%c[INFO] Loading object: ", "color: orange", {"path": file_path, "name": file_name, "name_with_ext": file_name_with_ext, "ext": file_ext})

        const data_send = {
            "command": "/file",
            "data": {
                "rid": RID,
                "abstractPath": file_path + "/" + file_name_with_ext
            }
        }
        console.debug("%c[SEND] WebRTC Request to Database: Get File via command file", "color: lightgreen", {"string": file_path + "/" + file_name_with_ext})
        WebRTCConnection.sendMessage(JSON.stringify(data_send))
    }

    /**************************************************************************************************************
     * Switch between the different views:
     * (1) Initial view
     * (2) Image
     * (3) Video
     * (4) LightField
     * (5) Mesh / PointCloud / Volumetric Video
     * (6) Gaussian Splatting
     **************************************************************************************************************/
    const switchView = (view) => {
        let emptyRenderer = $("#" + view_emptyID)
        let imageRenderer = $("#" + imageID)
        let videoRenderer = $("#" + videoID)
        let lightFieldRenderer = $("#" + view_lightfieldID)
        let meshRenderer = $("#" + renderCanvasID)
        let gaussianSplatRenderer = $("#" + view_gaussianSplat_ID)

        emptyRenderer.css("display", "none")
        imageRenderer.css("visibility", "hidden")
        videoRenderer.css("visibility", "hidden")
        lightFieldRenderer.css("display", "none")
        meshRenderer.css("display", "none")
        gaussianSplatRenderer.css("display", "none")

        // stop the video if it is still running
        try {  videoRenderer.children("video").get(0).pause(); }
        catch (error) {}

        if(view === "Image") {imageRenderer.css("visibility", "visible")}
        else if(view === "Video") {videoRenderer.css("visibility", "visible")}
        else if(view === "LightField") {lightFieldRenderer.css("display", "block")}
        else if(view === "Mesh") {meshRenderer.css("display", "block")}
        else if(view === "GaussianSplat") {gaussianSplatRenderer.css("display", "block")}
    }

    /**************************************************************************************************************
     * Disables the checkbox with the given ID
     **************************************************************************************************************/
    function disableCheckbox(id, method) {
        let checkbox = $("#" + id)
        if(checkbox.prop("checked")) method(checkbox)
        checkbox.prop("checked", false);
    }

    /**************************************************************************************************************
     * Allows the upload of local images and point clouds.
     * The items can be accessed via the <Uploads> button within the <DATABASE> window.
     * DISABLED: The upload function is disabled in the current version.
     **************************************************************************************************************/
    function chooseFile() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = _this => {
                let files =   Array.from(input.files);

                files.forEach(file => {
                    let reader = new FileReader();

                    reader.onload = function(e) {
                        let arrayBuffer = e.target.result;
 
                        WebRTCConnection.sendMessage(JSON.stringify({"command": "/upload_start", "data": file.name}))
                        WebRTCConnection.sendMessage(arrayBuffer, true)
                        WebRTCConnection.sendMessage(JSON.stringify({"command": "/upload_end", "data": ""}))
                    };
            
                    reader.readAsArrayBuffer(file);
                });
            };
        input.click();
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const switchDefault = () => {
        $("#" + view_emptyID).css("display", "flex")
        $("#" + imageID).css("visibility", "hidden")
        $("#" + videoID).css("visibility", "hidden")
        $("#" + renderCanvasID).css("display", "none")
        $("#" + view_lightfieldID).css("display", "none")
        $("#" + view_gaussianSplat_ID).css("display", "none")
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return(
        <div id={ID} style={props.style} className='renderer_container'>
            <div className="renderer_title">
                {ID !== 'renderer_out' ? <RendererButton onClick={switchDefault} src={"assets/icons/icon_x.png"}/> : null}
                {TITLE}
            </div>

            <div id={infoboxID} className='renderer_info_box'>
                fasefs
            </div>

            <div id={view_emptyID} className='emptyRenderer'>
                <div className="emptyRendererInner">
                    {ID === 'renderer_out' ? 'No output has been calculated yet.' : '(1) Select a file from the database (2) drag and drop it here (3) upload an object (only images are supported).'}
                    {ID !== 'renderer_out' ?
                        <div className='uploadButton' onClick={chooseFile}>
                            Upload
                        </div>
                    : null}
                </div>
            </div>

            <ImageRenderer 
                id={imageID} 
                filePath={filePath_Image}
                setComplete={setComplete}
                view={RID} 
                innerid={innerImageID}
            />
            <VideoRenderer 
                id={videoID} 
                filePath={filePath_Video}
                setComplete={setComplete}
                innerid={innerVideoID}/>
            {/* 
            This renderer is used for the following views:
            (1) Point Clouds
            (2) Meshes
            (3) Volumetric Videos
            (4) 3D Color Histograms
            (5) 3D Color Distributions
            (6) Gaussian Splatting
            */}
            <MeshRenderer 
                id={renderCanvasID} 
                filePath={filePath_Mesh}
                setComplete={setComplete}
                renderBarID={renderBarID}
                view={RID} 
                obj_type={mode.current}
            />
            <LightFieldRenderer 
                id={view_lightfieldID} 
                filePath={filePath_LightField}
                renderBarID={renderBarID}
                setComplete={setComplete}
                view={RID} 
            />

            <GaussianSplatRenderer 
                id={view_gaussianSplat_ID} 
                filePath={filePath_GaussianSplat}
                renderBarID={renderBarID}
                view={RID} 
                setComplete={setComplete}
            /> 

            <LoadingView id={view_loadingID}/>
            <RenderBar id={renderBarID}/>

        </div>
    );
}

export default Renderer;