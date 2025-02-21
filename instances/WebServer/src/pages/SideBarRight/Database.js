/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect} from "react";
import $ from 'jquery';

import './Database.scss';
import {active_server} from 'Utils/System'
import {createPreviewCard} from 'pages/Body/PreviewBoard'
import {pathjoin} from 'Utils/Utils'

/******************************************************************************************************************
 ******************************************************************************************************************
 ** EXPORTED FUNCTIONS
 ******************************************************************************************************************
 ******************************************************************************************************************/

/*
example:
database_sets = [
    {"folder_name": "name1",
        "file_paths": ["file1", file2, file3]},
    {"folder_name": "name2",
        "file_paths": ["file1", file2, file3]},
]
*/
let database_sets = []

const icon_database = "assets/icons/icon_database_grey.png";
const icon_database_elem = "assets/icons/icon_database2.png";
const icon_items_elem = "assets/icons/icon_cloud.png";
const icon_items_elem2 = "assets/icons/icon_frames2.png";
const icon_items_video = "assets/icons/icon_video.png";
const icon_items_unknown = "assets/icons/icon_unknown.png";
const icon_items_voluvideo = "assets/icons/icon_voluvideo.png";
const icon_items_lightfields = "assets/icons/icon_lightfield.png"
const icon_items_gaussiansplat = "assets/icons/icon_gaussiansplatting.png"
const icon_items_mesh = "assets/icons/icon_mesh.png";

/*-------------------------------------------------------------------------------------------------------------
-- [ {"name": "images",
--    "folders": [
--      {
--        "name": "examples",
--        "folders": [],
--        "files": ["exp1.ply", "exp2.ply"]}
--      }    
-- ]
--    "files": ["file1.png", "file2.png"]}
--    {"name": "pointclouds",
--     "folders": []
--     "files": ["file1.ply", "file2.ply"]} 
-- ]
-------------------------------------------------------------------------------------------------------------*/



/******************************************************************************************************************
 ** Create database buttons
 ******************************************************************************************************************/
export const createDBButtons = (database_obj, previews) => {
    $("#database_body").html("")
    $("#items_body").html("")

    for (const folder of database_obj[0]["folders"])
        create_folder_button(folder, 0, "", previews)
}

/******************************************************************************************************************
 ** Create Folder Buttons
 ******************************************************************************************************************/
export const create_folder_button = (folder, count, folder_path, previews) => {
    
    // add button to database area
    let database_elem = $("<div/>")
    database_elem.attr('class', 'database_elem').appendTo($("#database_body"));

    // add button icon
    $("<img/>").attr({class: "database_elem_icon", src: icon_database_elem, title: folder["name"]}).appendTo(database_elem)

    // add button text
    $("<div/>").html(folder["name"]).attr({class: "database_elem_text"}).appendTo(database_elem)

    // changes background color of button depending on hierarchy level
    // all folders with count > 0 are subfolders and should be hidden
    if(count !== 0) {
        let colNum = 50 + count * 50
        database_elem.css("background-color", "RGB(" + 50 + "," + colNum + "," + colNum + ")")
        database_elem.on("mouseover", function() {database_elem.css("background-color",  "#1C6C90");}); 
        database_elem.on("mouseout", function() {database_elem.css("background-color",  "RGB(" + 50 + "," + colNum + "," + colNum + ")");}); 
        database_elem.css("display", 'none')
    }

    var arr_subs = []
    let num_meshes = 0
    for (const subfolder of folder["folders"]){
        // folder with the start string "$mesh$" contains meshes, i.e, one obj, mtl and png file
        if(subfolder["name"].includes("$mesh$") || 
            subfolder["name"].includes("$volumetric$") || 
            subfolder["name"].includes("$lightfield$") || 
            subfolder["name"].includes("$gaussiansplat$")) 
        {
            num_meshes += 1
            continue
        }

        const new_folder = create_folder_button(subfolder, count + 1, pathjoin(folder_path, folder["name"]), previews)
        arr_subs.push(new_folder[0])
        database_elem.on("click", function() {show_subfolders(new_folder)})
    }

    // additionally to each file, a new item has to be created for each mesh folder 
    if(folder["files"].length + num_meshes > 0 )
        database_elem.on("click", function() {show_files(folder, pathjoin(folder_path, folder["name"]), previews)});

    return [database_elem, arr_subs]
}

/******************************************************************************************************************
 ** Show Subfolders
 ******************************************************************************************************************/
export const show_subfolders = (fold) => {
    $("#items_body").html("")
    if(fold[0].css("display") === "none")
        fold[0].css("display", 'block');
    else {
        fold[0].css("display", 'none');
        // hides all subfolders
        for(const el of fold[1])
            el.css("display", 'none');
    }
}

/******************************************************************************************************************
 ** Show Files
 ******************************************************************************************************************/
export const show_files = (fold, file_path, previews) => {
    var items_body = $("#items_body").html("")
    console.debug("%c[INFO] Open folder:", "color: orange", file_path)
    // empty preview board
    $("#body_preview").html("")

    function showSrcRefButtons(data, elem){
        // Create a new div element
        let srcDiv = $("<div></div>");
        // You can set the content of the div like this
        srcDiv.addClass("item_source_button").text("Source");
        // Append the new div to items_elem
        $(elem).append(srcDiv);

        // Create a new div element
        let refDiv = $("<div></div>");
        // You can set the content of the div like this
        refDiv.addClass("item_reference_button").text("Reference");
        // Append the new div to items_elem
        $(elem).append(refDiv);

        $(srcDiv).on("click", function(e){
            $("#renderer_src").trigger("itemClicked", [data]); // Trigger a custom event
            console.log(data)
        });

        $(refDiv).on("click", function(e){
            $("#renderer_ref").trigger("itemClicked", [data]); // Trigger a custom event
        });

        $(elem).on("mouseleave", function(e){
            srcDiv.remove();
            refDiv.remove();
        });
    }

    // check if folder has a $mesh$ identifier -> the folder will be displayed as item
    let iterate_fold_obj = fold["folders"];
    for (const element of iterate_fold_obj) {
        if(element["name"].includes("$mesh$")){
            let file_name = element["name"].replace("$mesh$", "")
            let items_elem = $("<div/>").attr("title", file_name).attr("draggable", "true").addClass("items_elem");
            let items_elem_icon = $("<img/>").addClass("items_elem_icon").attr("src", icon_items_mesh)
            let items_elem_text = $("<div/>").html(file_name).addClass("items_elem_text")

            $(items_elem).on("dragstart", function(e){
                let data = file_path + "/" + element["name"] + ":" + file_name + ".mesh";
                e.originalEvent.dataTransfer.setData('text', data);
            });

            // WARNING: Boilerplate code
            // if the items is clicked the user has to decide if it should be loaded as reference or source
            $(items_elem).on("click", function(e){
                let data = file_path + "/" + element["name"] + ":" + file_name + ".mesh";
                showSrcRefButtons(data, this)
            });

            items_elem.append(items_elem_icon)
            items_elem.append(items_elem_text)
            items_body.append(items_elem)  

            let full_path = file_path + "/" + element["name"] + ":" + file_name + ".mesh"
            // objects which are created and uploaded have no preview
            if(file_path !== "Output" && file_path !== "Uploads")
                createPreviewCard(pathjoin(active_server, "files/previews", file_path), file_name, full_path, previews)
        }
        else if(element["name"].includes("$volumetric$")){
            let file_name = element["name"].replace("$volumetric$", "")
            let items_elem = $("<div/>").attr("title", file_name).attr("draggable", "true").addClass("items_elem");
            let items_elem_icon = $("<img/>").addClass("items_elem_icon").attr("src", icon_items_voluvideo)
            let items_elem_text = $("<div/>").html(file_name).addClass("items_elem_text")

            $(items_elem).on("dragstart", function(e){
                // use custom file extension for volumetric videos so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + ".volu";
                e.originalEvent.dataTransfer.setData('text', data);
            });

            // WARNING: Boilerplate code
            // if the items is clicked the user has to decide if it should be loaded as reference or source
            $(items_elem).on("click", function(e){
                // use custom file extension for volumetric videos so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + ".volu";
                showSrcRefButtons(data, this)
            });

            items_elem.append(items_elem_icon)
            items_elem.append(items_elem_text)
            items_body.append(items_elem)  


            let full_path = file_path + "/" + element["name"] + ":" + file_name + ".volu"
            // objects which are created and uploaded have no preview
            if(file_path !== "Output" && file_path !== "Uploads")
                createPreviewCard(pathjoin(active_server, "files/previews", file_path), file_name, full_path, previews)
        }
        else if(element["name"].includes("$gaussiansplat$")){
            let file_name = element["name"].replace("$gaussiansplat$", "")
            let items_elem = $("<div/>").attr("title", element["files"][0]).attr("draggable", "true").addClass("items_elem");
            let items_elem_icon = $("<img/>").addClass("items_elem_icon").attr("src", icon_items_gaussiansplat)
            let items_elem_text = $("<div/>").html(file_name).addClass("items_elem_text")

            $(items_elem).on("dragstart", function(e){
                // use custom file extension for volumetric videos so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + "-" + file_extension + ".gsp";
                e.originalEvent.dataTransfer.setData('text', data);
            });

            // WARNING: Boilerplate code
            // if the items is clicked the user has to decide if it should be loaded as reference or source
            $(items_elem).on("click", function(e){
                // use custom file extension for volumetric videos so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + "-" + file_extension + ".gsp";
                showSrcRefButtons(data, this)
            });

            items_elem.append(items_elem_icon)
            items_elem.append(items_elem_text)
            items_body.append(items_elem)  

            // in the $gaussiansplat$... folder there is only one file
            let file_extension = element["files"][0].split(".")[1]

            let full_path = file_path + "/" + element["name"] + ":" + file_name + "-" + file_extension + ".gsp"
            // objects which are created and uploaded have no preview
            if(file_path !== "Output" && file_path !== "Uploads")
                createPreviewCard(pathjoin(active_server, "files/previews", file_path), file_name, full_path, previews)
        }
        else if(element["name"].includes("$lightfield$")){
            let file_name = element["name"].replace("$lightfield$", "")
            let items_elem = $("<div/>").attr("title", file_name).attr("draggable", "true").addClass("items_elem");
            let items_elem_icon = $("<img/>").addClass("items_elem_icon").attr("src", icon_items_lightfields)
            let items_elem_text = $("<div/>").html(file_name).addClass("items_elem_text")

            $(items_elem).on("dragstart", function(e){
                // use custom file extension for lightfields so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + ".lf";
                e.originalEvent.dataTransfer.setData('text', data);
            });

            // WARNING: Boilerplate code
            // if the items is clicked the user has to decide if it should be loaded as reference or source
            $(items_elem).on("click", function(e){
                // use custom file extension for lightfields so that the renderer knows how to handle the file
                let data = file_path + "/" + element["name"] + ":" + file_name + ".lf";
                showSrcRefButtons(data, this)
            });

            items_elem.append(items_elem_icon)
            items_elem.append(items_elem_text)
            items_body.append(items_elem)  

            let full_path = file_path + "/" + element["name"] + ":" + file_name + ".lf"
            // objects which are created and uploaded have no preview
            if(file_path !== "Output" && file_path !== "Uploads")
                createPreviewCard(pathjoin(active_server, "files/previews", file_path), file_name, full_path, previews)
        }
    }

    let iterate_obj = fold["files"];
    for (const element of iterate_obj) {
        let file_name = element;
        let items_elem = $("<div/>").attr("title", file_name).attr("draggable", "true").addClass("items_elem");
        
        $(items_elem).on("dragstart", function(e){
            let data = file_path + ":" + file_name;
            e.originalEvent.dataTransfer.setData('text', data);
        });

        // if the items is clicked the user has to decide if it should be loaded as reference or source
        $(items_elem).on("click", function(e){
            let data = file_path + ":" + file_name;
            showSrcRefButtons(data, this)
        });

        // choose item image depending on object type
        let items_elem_icon = $("<img/>").addClass("items_elem_icon")
        
        let file_extension = element.split(".")[1]
        // get file extension to choose correct image in "ITEMS"
        if (file_extension === "ply" || file_extension === "obj")
            $(items_elem_icon).attr("src", icon_items_elem)
        else if(file_extension === "png" || file_extension === "jpg")
            $(items_elem_icon).attr("src", icon_items_elem2)
        else if(file_extension === "mp4")
            $(items_elem_icon).attr("src", icon_items_video)
        else
            $(items_elem_icon).attr("src", icon_items_unknown)
            
        let items_elem_text = $("<div/>").html(file_name).addClass("items_elem_text")
        
        items_elem.append(items_elem_icon)
        items_elem.append(items_elem_text)
        items_body.append(items_elem)  

        let full_path = file_path + ":" + file_name

        // objects which are created and uploaded have no preview
        if(file_path !== "Output" && file_path !== "Uploads")
            createPreviewCard(pathjoin(active_server, "files/previews", file_path), file_name, full_path, previews)
    }

    if (window.innerWidth < 1000) {
        $("#database_main").css("display", "none")
        $("#items_main").css("display", "block")
    }
}


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Database(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    const icon_return = "assets/icons/icon_arrow_left.png";

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        const styles = getComputedStyle(document.documentElement);
        setMobileMaxWidth(String(styles.getPropertyValue('--mobile-max-width')).trim());
    }, []);


    let componentStyle = {};
    let returnButtonStyle = {};
    if (window.innerWidth < mobileMaxWidth) {
        componentStyle = {display: "none", width: "calc(100% - 6px)", top: "0px", height: "calc(100% - 6px)"};
        returnButtonStyle = {display:"block"}
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Info: the corresponing button is only shown in mobile mode
     * hide the database window and show the database server window
     **************************************************************************************************************/
    function returnToDatabaseServer() {
        $("#database_main").css("display", "none")
        $("#dbserver_main").css("display", "block")
        $("#body_preview").css("display", "none")
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id="database_main" style={componentStyle}>
            <div id="database_header">
                <img id='database_header_logo' src={icon_database} alt=""/>
                <div id='database_header_name'>DATABASE</div>

                <div id='database_return_button' onClick={returnToDatabaseServer} style={returnButtonStyle}>
                    <img id="database_return_icon" src={icon_return}/>
                </div>
            </div>
            <div id="database_body"/>
        </div>
    );
}

export default Database;