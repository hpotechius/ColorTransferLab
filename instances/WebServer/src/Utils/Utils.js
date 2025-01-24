/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import $ from 'jquery'
import * as THREE from "three";
import {TextureLoader} from 'three';

import {evaluation_results, execution_data, WebRTCConnection} from 'Utils/System'


/******************************************************************************************************************
 * Send request to python server for evaluation which will be printed within the Evaluation tab.
 * Works only if the <comparison> and <output> objects are given.
 ******************************************************************************************************************/
export const evalPrint = () => {
    if(execution_data["output"] === "" || execution_data["source"] === "" || execution_data["reference"] === "") {
        consolePrint("WARNING", "Source, Reference and Output images have to be given.")
        return
    }

    if (!execution_data["source"].includes(".png") && !execution_data["source"].includes(".jpg")) {
        consolePrint("WARNING", "Evaluation only for images available...")
        return
    }

    consolePrint("INFO", "Start Evaluation ...")

    // add source extension to the output path
    const src_ext = execution_data["source"].split('.')[1]
    const out_path = execution_data["output"] + "." + src_ext

    const out_dat = {
        "command": "/evaluation",
        "data": {
            "source": execution_data["source"],
            "reference": execution_data["reference"],
            "output": out_path
        }
    }
    console.debug("%c[SEND] WebRTC Request to Database: Apply Evaluation with metric: PSNR for data:", "color: lightgreen;", out_dat)
    WebRTCConnection.sendMessage(JSON.stringify(out_dat))
}

/******************************************************************************************************************
 * Export evaluation results to a JSON file.
 ******************************************************************************************************************/
export const exportMetrics = () => {
    if(Object.keys(evaluation_results).length === 0) {
        consolePrint("WARNING", "Server has to be selected for exporting evaluation results...")
    } else {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluation_results, null, 4));
        var dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href",     dataStr     );
        dlAnchorElem.setAttribute("download", "evaluation_results.json");
        dlAnchorElem.click();
    }
}

/******************************************************************************************************************
 * Request available color transfer metrics and create entries
 ******************************************************************************************************************/
export const createMetricEntries = (metrics) => {
    // init evaluation
    var console_eval = document.getElementById("console_evaluation")
    console_eval.innerHTML = ""

    const tbl = document.createElement("table");
    const tblBody = document.createElement("tbody");

    // create table header
    const cell = document.createElement("th");
    const cellText = document.createTextNode("Metric")
    cell.appendChild(cellText);

    const cell3 = document.createElement("th");
    const cellText3 = document.createTextNode("Name")
    cell3.appendChild(cellText3);

    const cell2 = document.createElement("th");
    const cellText2 = document.createTextNode("Value")
    cell2.appendChild(cellText2);

    const row = document.createElement("tr");
    row.appendChild(cell);
    row.appendChild(cell3);
    row.appendChild(cell2);
    tblBody.appendChild(row)

    for(let j = 0; j < metrics.length; j++) {
        const cell = document.createElement("td");
        cell.setAttribute("title", metrics[j]["description"])
        const cellText = document.createTextNode(metrics[j]["key"])
        cell.appendChild(cellText);

        const cell3 = document.createElement("td");
        const cellText3 = document.createTextNode(metrics[j]["name"])
        cell3.appendChild(cellText3);

        const cell2 = document.createElement("td");
        const cellText2 = document.createTextNode(" ")
        cell2.appendChild(cellText2);
        cell2.id = "metric_" + metrics[j]["key"];

        const row = document.createElement("tr");
        row.appendChild(cell);
        row.appendChild(cell3);
        row.appendChild(cell2);
        tblBody.appendChild(row)
    }

    tbl.appendChild(tblBody);
    tbl.setAttribute("tableLayout", "auto");
    tbl.setAttribute("width", "100%");
    console_eval.append(tbl)
}

/******************************************************************************************************************
 * Prints the given output with timestamp and type.
 * Available types: (1) INFO, (2) WARNING, (3) ERROR (4) UNDEFINED 
 ******************************************************************************************************************/
export const consolePrint = (type, output) => {
    let sClass = ""
    if(type === "INFO") sClass = "server_info"
    else if(type === "WARNING") sClass = "server_warning"
    else if(type === "ERROR") sClass = "server_error"
    else sClass = "server_undefined"

    let today = new Date()
    let time = today.getHours().toString().padStart(2, '0') + ":" +
               today.getMinutes().toString().padStart(2, '0') + ":" +
               today.getSeconds().toString().padStart(2, '0');
    let printOut = "<span class='" + sClass + "'>[" + type + " - " + time +"]</span> " + output + "...<br>"

    let objDiv = document.getElementById("console_terminal")
    objDiv.innerHTML += printOut 
    
    // Scroll to the bottom
    objDiv.scrollTop = objDiv.scrollHeight;
}

/******************************************************************************************************************
 * Combines the given path elements to a single path.
 ******************************************************************************************************************/
export const pathjoin = (...vals) => {
    let joinedpath = "";
    let init = true;
    for (let val of vals) {
        let seperator = "/"
        // ignore empty strings
        if(val === "")
            continue
        // prevent adding a seperator at the beginning
        if(init)
            seperator = ""
        joinedpath  += seperator + val;
        init = false
    }
    return joinedpath;
}

/******************************************************************************************************************
 * Get a random ID.
 ******************************************************************************************************************/
export const getRandomID = () => {
    var rid = Math.random().toString().replace(".", "OUTPUT")
    return rid
}

/******************************************************************************************************************
 * Set color transfer data in the configuration tab.
 ******************************************************************************************************************/
export const setConfiguration = (param) => {
    // set options in configuration tab of console
    const configurationview = $("#console_configuration").html("")

    const tblBody = $("<tbody/>");
    const headerVal = ["Parameter", "Value", "Type", "Choices"]
    const optionsVal = ["name", "default", "type", "values"]

    // create table header
    const row = $("<tr/>")
    for(let j = 0; j < 4; j++) {
        const cell = $("<th/>").attr("class", "cell_config")
        const cellText = document.createTextNode(headerVal[j])
        row.append($(cell).append($(cellText)));
    }
    tblBody.append($(row))

    // creating all cells
    for (let i = 0; i < param.length; i++) {
        // if flag "changeable" is set to false the parameter shouldn't be listed
        if(!param[i]["changeable"])
            continue;

        // creates a table row
        const row = document.createElement("tr");

        for (let j = 0; j < 4; j++) {
            // Create a <td> element and a text node, make the text
            // node the contents of the <td>, and put the <td> at
            // the end of the table row
            const cell = document.createElement("td");
            let cellcontent = null

            function set_option(event, num, type) {
                if(type === "int" || type === "float")
                    execution_data["options"][num]["default"] = Number(event.currentTarget.value)
                else if(type === "bool")
                    execution_data["options"][num]["default"] = (event.currentTarget.value === "true")
                else
                execution_data["options"][num]["default"] = event.currentTarget.value
            }

            if (optionsVal[j] === "default") {
                // create select node if a finit number of options are available for a parameter
                if( param[i]["values"].length > 0 ) {
                    cellcontent = document.createElement("select");
                    cellcontent.addEventListener("change", event => {set_option(event, i, param[i]["type"])})

                    for(let x = 0; x < param[i]["values"].length; x++){
                        let va = param[i]["values"][x]
                        const cellVal = document.createElement("option");
                        cellVal.setAttribute("value", va);
                        if(va === param[i]["default"])
                            cellVal.selected = true
            
                        cellVal.innerHTML = va
                        cellcontent.appendChild(cellVal);
                    }
                }
                else if( param[i]["type"] === "int" ) {
                    let va = param[i]["default"]
                    cellcontent = document.createElement("input");
                    cellcontent.addEventListener("change", event => {set_option(event, i, param[i]["type"])})
                    cellcontent.setAttribute("value", va);
                    cellcontent.type = "number"
                    cellcontent.min = "-99999"
                    cellcontent.max = "99999"
                }
                else if( param[i]["type"] === "float" ) {
                    let va = param[i]["default"]
                    cellcontent = document.createElement("input");
                    cellcontent.addEventListener("change", event => {set_option(event, i, param[i]["type"])})
                    cellcontent.setAttribute("value", va);
                    cellcontent.type = "number"
                    cellcontent.step = "0.1"
                    cellcontent.min = "0"
                    cellcontent.max = "99999"
                }
                else {
                    cellcontent = document.createElement("div");
                    cellcontent.innerHTML = "Placeholder"
                    cellcontent.classList.add("cell_config");
                }
            } 
            else if (optionsVal[j] === "name") {
                cellcontent = document.createTextNode(param[i][optionsVal[j]]);
                cell.title = param[i]["tooltip"]
            }
            else if (optionsVal[j] === "values") {
                let out_str = ""
                for(let val of param[i][optionsVal[j]])
                    out_str += val + ",\n"
                cellcontent = document.createTextNode(out_str);
            }
            else {
                cellcontent = document.createTextNode(param[i][optionsVal[j]]);
            }

            cell.className = "cell_config"
            cell.appendChild(cellcontent);
            row.appendChild(cell);
        }
        // add the row to the end of the table body
        tblBody.append($(row))
    }

    $(configurationview).append($("<table/>").append($(tblBody)))
}

/******************************************************************************************************************
 * Set color transfer data, i.e. abstract, title, etc., in the information tab
 ******************************************************************************************************************/
export const setInformation = (param) => {
    // set abstract in information tab of console
    var console_info = document.getElementById("console_information")
    console_info.innerHTML = "<b>Publication</b>: " + param["publication"] + "<br>" +
                            "<b>DOI</b>: <a href='" + param["doi"] + "' target='_blank'>" + param["doi"] + "</a><br>" + 
                            "<b>Year</b>: " + param["year"] + "<br>" + 
                            "<b>Scientific Venue</b>: " + param["scientificVenue"] + "<br><br>" + 
                            "<b>Abstract</b>:<br>" + param["abstract"]
}

/******************************************************************************************************************
 * 
 ******************************************************************************************************************/
export const updateHistogram_old = (stat_obj, window) => {
    const setPixel = (x, y, w, h, image, r, g, b, val) => {
        if(val === "all") {
            image[(x + (h-y) * w) * 4 + 0] = r;
            image[(x + (h-y) * w) * 4 + 1] = g;
            image[(x + (h-y) * w) * 4 + 2] = b;
        } else if (val === "red")
            image[(x + (h-y) * w) * 4 + 0] = r; 
        else if (val === "green")
            image[(x + (h-y) * w) * 4 + 1] = r; 
        else if (val === "blue")
            image[(x + (h-y) * w) * 4 + 2] = r;
    
        image[(x + (h-y) * w) * 4 + 3] = 255;
    }

    let canvasid = "histogram_canvas_" + window
    let histostatsid = "histogram_stats_" + window

    var histogram = stat_obj["data"]["histogram"]
    var mean = stat_obj["data"]["mean"]
    var std = stat_obj["data"]["std"]

    var maxV = Math.max.apply(null, histogram.map(function(row){ return Math.max.apply(Math, row); }))

    var histogram_scaled = []
    for(var i = 0; i < histogram.length; i++)
        histogram_scaled[i] = [Math.floor(histogram[i][0]/maxV*100), Math.floor(histogram[i][1]/maxV*100), Math.floor(histogram[i][2]/maxV*100)];

    var c = document.getElementById(canvasid);
    var ctx = c.getContext("2d");
    c.height = 100

    var imageData = ctx.createImageData(256, 100);
    for (let x = 0; x < 256; x++) {
        if(x % 64 === 0 && x !== 0){
            for (let y=0; y < 100; y++){
                setPixel(x, y, 256, 100, imageData.data, 128, 128, 128, "all")
            }
        }

        for (let y=0; y < histogram_scaled[x][0]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "red")
        for (let y=0; y < histogram_scaled[x][1]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "green")
        for (let y=0; y < histogram_scaled[x][2]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "blue")
    }
    ctx.putImageData(imageData, 0, 0);

    var stats_color = document.getElementById(histostatsid);
    stats_color.innerHTML = "Mean: (" + mean[0] + ", " + mean[1] + ", " + mean[2] + ") <br/>" +
                            "Std: (" + std[0] + ", " + std[1] + ", " + std[2] + ")"
}

/******************************************************************************************************************
 * 
 ******************************************************************************************************************/
export const updateHistogram = (stat_obj, mean, std, window) => {
    const setPixel = (x, y, w, h, image, r, g, b, val) => {
        if(val === "all") {
            image[(x + (h-y) * w) * 4 + 0] = r;
            image[(x + (h-y) * w) * 4 + 1] = g;
            image[(x + (h-y) * w) * 4 + 2] = b;
        } else if (val === "red")
            image[(x + (h-y) * w) * 4 + 0] = r; 
        else if (val === "green")
            image[(x + (h-y) * w) * 4 + 1] = r; 
        else if (val === "blue")
            image[(x + (h-y) * w) * 4 + 2] = r;
    
        image[(x + (h-y) * w) * 4 + 3] = 255;
    }

    let canvasid = "histogram_canvas_" + window
    let histostatsid = "histogram_stats_" + window
    var histogram = stat_obj

    function findMaxIn2DArray(array) {
        let max = -Infinity;
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array[i].length; j++) {
                if (array[i][j] > max) {
                    max = array[i][j];
                }
            }
        }
        return max;
    }

    const maxV = findMaxIn2DArray(histogram)
    var histogram_scaled = []
    for(var i = 0; i < histogram.length; i++)
        histogram_scaled[i] = [Math.floor(histogram[i][0]/maxV*100), Math.floor(histogram[i][1]/maxV*100), Math.floor(histogram[i][2]/maxV*100)];

    var c = document.getElementById(canvasid);
    var ctx = c.getContext("2d");
    c.height = 100

    var imageData = ctx.createImageData(256, 100);
    for (let x = 0; x < 256; x++) {
        if(x % 64 === 0 && x !== 0){
            for (let y=0; y < 100; y++){
                setPixel(x, y, 256, 100, imageData.data, 128, 128, 128, "all")
            }
        }

        for (let y=0; y < histogram_scaled[x][0]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "red")
        for (let y=0; y < histogram_scaled[x][1]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "green")
        for (let y=0; y < histogram_scaled[x][2]; y++)
            setPixel(x, y, 256, 100, imageData.data, 255, 0, 0, "blue")
    }
    ctx.putImageData(imageData, 0, 0);

    var stats_color = document.getElementById(histostatsid);
    stats_color.innerHTML = "Mean: (" + mean[0] + ", " + mean[1] + ", " + mean[2] + ") <br/> " +
                            "Std: (" + std[0] + ", " + std[1] + ", " + std[2] + ")"
}

/**************************************************************************************************************
 * 
 **************************************************************************************************************/
export const calculateMeanAndStdDev = (colorsArray, normalized, channels) => {
    let scale = 1.0
    if(normalized)
        scale = 255.0

    const r = [], g = [], b = [];
    for (let i = 0; i < colorsArray.length; i += channels) {
        const rValue = colorsArray[i] * scale;
        const gValue = colorsArray[i + 1] * scale;
        const bValue = colorsArray[i + 2] * scale;
        let aValue = 255.0
        if(channels === 4){
            aValue = colorsArray[i + 3] * scale;
        }

        if (!isNaN(rValue) && !isNaN(gValue) && !isNaN(bValue) && aValue > 0) {
            r.push(rValue);
            g.push(gValue);
            b.push(bValue);
        }
    }

    const calculateStats = (array) => {
        const sum = array.reduce((acc, value) => acc + value, 0);
        const mean = Math.round(sum / array.length);

        const squaredDifferences = array.map(value => Math.pow(value - mean, 2));
        const meanSquaredDifference = squaredDifferences.reduce((acc, value) => acc + value, 0) / array.length;
        const stdDev = Math.round(Math.sqrt(meanSquaredDifference));

        return { mean, stdDev };
    };

    const rStats = calculateStats(r);
    const gStats = calculateStats(g);
    const bStats = calculateStats(b);

    return {
        mean: [rStats.mean, gStats.mean, bStats.mean],
        stdDev: [rStats.stdDev, gStats.stdDev, bStats.stdDev]
    };
}
/**************************************************************************************************************
 * 
 **************************************************************************************************************/
export const calculateColorHistograms = (colorsArray, normalized, channels) => {
    // create a histogram of colors for rendering in the histogram tab of the console
    const histogram = new Array(256).fill(null).map(() => new Array(3).fill(0));
    // Initialise a 3D array for the bins
    const bins = new Array(10).fill(null).map(() => 
        new Array(10).fill(null).map(() => 
            new Array(10).fill(0)
        )
    );

    let scale = 255.0
    if(normalized)
        scale = 1.0

    // Initialisieren Sie eine Variable für den maximalen Wert
    let maxValue = 0;
    for (let i = 0; i < colorsArray.length; i += channels) {

        const rScale = colorsArray[i] / scale
        const gScale = colorsArray[i+1] / scale
        const bScale = colorsArray[i+2] / scale
        let aValue = 1.0

        if(channels === 4){
            aValue = colorsArray[i + 3] / scale;
        }

        const r = Math.min(Math.max(Math.round(rScale * 255), 0), 255);
        const g = Math.min(Math.max(Math.round(gScale * 255), 0), 255);
        const b = Math.min(Math.max(Math.round(bScale * 255), 0), 255);
        if (isNaN(r) || isNaN(g) || isNaN(b) || aValue === 0)
            continue

        histogram[r][0]++;
        histogram[g][1]++;
        histogram[b][2]++;

        // Determining the bin indices
        const rBin = Math.min(Math.floor(rScale * 10), 9);
        const gBin = Math.min(Math.floor(gScale * 10), 9);
        const bBin = Math.min(Math.floor(bScale * 10), 9);

        // Increase the count for the corresponding bin
        bins[rBin][gBin][bBin]++;
        if (bins[rBin][gBin][bBin] > maxValue) {
            maxValue = bins[rBin][gBin][bBin];
        }
    }

    // volume of largest sphere
    let maxVolume = 4/3 * Math.PI * Math.pow(0.5, 3)
    let spheres = []
    
    for (let r = 0; r < 10; r++) {
        for (let g = 0; g < 10; g++) {
            for (let b = 0; b < 10; b++) {
                if (bins[r][g][b] > 0) {
                    const color = new THREE.Color(r / 10 + 0.05, g / 10 + 0.05, b / 10 + 0.05);

                    // 0.05 is added to the color values to place the sphere in the center of the bin
                    // Each bin has a size of 0.1.
                    const position = new THREE.Vector3((r / 10 + 0.05) * 4, (g / 10 + 0.05) * 4, (b / 10 + 0.05) * 4) ;
                    // caluculate radius of sphere based on the scaled volume of the sphere
                    const radius = Math.pow(bins[r][g][b] / maxValue  * maxVolume / Math.PI * 3/4, 1/3);
                    // Sacling so that the largest sphere fills the entire bin
                    const scale = Math.max(radius / 10 * 4 * 2, 0.05)//bins[r][g][b] / maxValue / 10 * 4; 

                    spheres.push(
                        <mesh key={`${r}-${g}-${b}`} position={position} scale={[scale, scale, scale]}>
                            <sphereGeometry args={[0.5, 32, 32]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    );
                }
            }
        }
    }

    return [histogram, spheres];
}

/**************************************************************************************************************
 * Function to load a texture and convert it into an array.
 * Is used to create the 2D and 3D histograms.
 **************************************************************************************************************/
export const loadTextureAndConvertToArray = (url, callback) => {
    const loader = new TextureLoader();
    loader.load(
        url,
        (texture) => {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set the canvas size to the texture size
            canvas.width = texture.image.width;
            canvas.height = texture.image.height;

            // Draw the texture onto the canvas
            context.drawImage(texture.image, 0, 0);

            // Extract the pixel data from the canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelArray = imageData.data;

            // The amount of channels is 4 (RGBA) for a standard canvas
            const numberOfChannels = imageData.data.length / (canvas.width * canvas.height);

            // Call the callback function with the pixel array
            callback(pixelArray, canvas.width, canvas.height, numberOfChannels);
        },
        undefined,
        (error) => {
            console.error('Error loading texture:', error);
        }
    );
}