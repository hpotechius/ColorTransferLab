/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import {BufferAttribute} from 'three';

import {updateHistogram, loadTextureAndConvertToArray, calculateColorHistograms, calculateMeanAndStdDev} from 'Utils/Utils';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
const Image = forwardRef((props, ref) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
     const [state, setState] = useState({
        greyscale: false,
        histogram3D: [],
        colordistribution: [],
        info: {
            "width": 0,
            "height": 0,
            "channels": 0
        }
    });

    const [imagePath, setImagePath] = useState(null)
    const [textureloaded, setTextureloaded] = useState(false)

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * useImperativeHandle hook to expose methods to parent components
     * 
     * This hook allows the parent component to access and update the state of this component.
     * - getState: Returns the current state.
     * - updateState: Merges the new state with the previous state and updates it.
     **************************************************************************************************************/
    useImperativeHandle(ref, () => ({
        getState() {
            return state;
        },
        updateState(newState) {
            setState(prevState => ({
                ...prevState,
                ...newState,
            }));
        },
    }));

    /**************************************************************************************************************
     * Update the histogram data for 2D and 3D rendering
     **************************************************************************************************************/
    useEffect(() => {
        setImagePath(props.filePath)
        if(props.filePath !== null){
            const textureUrl = props.filePath;
            loadTextureAndConvertToArray(textureUrl, (pixelArray, width, height, channels) => {
                console.debug("%c[INFO] Creation of 2D and 3D Histograms", "color: orange;")
                // set the histogram data for 2D and 3D rendering
                const histograms = calculateColorHistograms(pixelArray, false, 4)
                const { mean, stdDev } = calculateMeanAndStdDev(pixelArray, false, 4);
                const histogram2D = histograms[0]

                updateHistogram(histogram2D, mean, stdDev, props.view)

                let colors_buf = new Float32Array(pixelArray)
                // Remove every fourth value from colors_buf and divide the remaining values by 255
                const filteredColorsBuf = colors_buf
                    .filter((_, index) => (index + 1) % 4 !== 0)
                    .map(value => value / 255);

                setState(prevState => ({
                    ...prevState,
                    histogram3D: histograms[1],
                    colordistribution: new BufferAttribute(new Float32Array(filteredColorsBuf), 3),
                    info: {
                        width: width,
                        height: height,
                        channels: channels
                    }
                }));

                setTextureloaded(true)

            });
        }

    }, [props.filePath])

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div 
            className="image-container" 
            style={{
                overflow: "hidden", 
                width: "100%", 
                height: "calc(100% - 25px)", 
                backgroundColor: "black",
                display: props.visibility ? "block" : "none"
            }}
        >
            <img 
                id={props.innerid} 
                className="renderer_image_inner" 
                data-update={0}
                data-src={imagePath}
                src={imagePath}
            />
        </div>
    );
})

export default Image;