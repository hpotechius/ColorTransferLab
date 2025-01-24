/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect} from 'react';

import './Histogram.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Histogram(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Initialize empty histogram canvases.
     **************************************************************************************************************/
    useEffect(() => {
        const canvasIDs = ["histogram_canvas_src", "histogram_canvas_ref", "histogram_canvas_out"]
        for(let i = 0; i < canvasIDs.length; i++){
            const c = document.getElementById(canvasIDs[i]);
            const ctx = c.getContext("2d");
            const imageData = ctx.createImageData(256, 100);
            for (let x = 0; x < 256; x++) {
                if(x % 64 == 0 && x != 0){
                    for (let y=0; y < 100; y++){
                        setPixel(x, y, 256, 100, imageData.data, 128, 128, 128, "all")
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }
    }, [])

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Draw histogram.
     **************************************************************************************************************/
    const setPixel = (x, y, w, h, image, r, g, b, val) => {
        if(val == "all") {
            image[(x + (h-y) * w) * 4 + 0] = r;
            image[(x + (h-y) * w) * 4 + 1] = g;
            image[(x + (h-y) * w) * 4 + 2] = b;
        } else if (val == "red")
            image[(x + (h-y) * w) * 4 + 0] = r; 
        else if (val == "green")
            image[(x + (h-y) * w) * 4 + 1] = r; 
        else if (val == "blue")
            image[(x + (h-y) * w) * 4 + 2] = r;
    
        image[(x + (h-y) * w) * 4 + 3] = 255;
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className='histogram'>
            <div id="histogram_src" className='color_histogram'>
                <canvas id={"histogram_canvas_src"} className="canvas" width="256" height="100"></canvas>
                <div id={"histogram_stats_src"} className="histogram_stats">Mean: (0, 0, 0) <br/> Std: (0, 0, 0)</div>
            </div>
            <div id="histogram_ref" className='color_histogram'>
                <canvas id={"histogram_canvas_ref"} className="canvas" width="256" height="100"></canvas>
                <div id={"histogram_stats_ref"} className="histogram_stats">Mean: (0, 0, 0) <br/> Std: (0, 0, 0)</div>
            </div>
            <div id="histogram_out" className='color_histogram'>
                <canvas id={"histogram_canvas_out"} className="canvas" width="256" height="100"></canvas>
                <div id={"histogram_stats_out"} className="histogram_stats">Mean: (0, 0, 0) <br/> Std: (0, 0, 0)</div>
            </div>
        </div>
    );
}

export default Histogram;