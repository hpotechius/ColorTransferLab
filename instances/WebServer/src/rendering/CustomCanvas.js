/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {Suspense, useState, useEffect, useRef} from 'react';
import {Canvas} from "@react-three/fiber";
import $ from 'jquery';
import {updateHistogram, calculateColorHistograms, calculateMeanAndStdDev,loadTextureAndConvertToArray} from 'Utils/Utils';

function CustomCanvas(props) {    
    const [currentIndex, setCurrentIndex] = useState(0);
    const meshRefs = useRef([]);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        if (info !== null) {
            props.setInfo(info);
        }
    }, [info, props]);


    useEffect(() => {
        if (Array.isArray(props.rendering)) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    const nu = props.rendering.length;
                    // check if the rendering array is empty to prevent currentIndex to be nan
                    if (nu === 0) {
                        return 0;
                    } else {
                        let newIndex = (prevIndex + 1) % nu;

                        if(!props.playing.current) {
                            newIndex = prevIndex;
                            if(props.forward.current) {
                                newIndex = (prevIndex + 1) % nu;
                                props.forward.current = false;
                            }
                            if(props.backward.current) {
                                newIndex = prevIndex - 1;
                                if (newIndex < 0) {
                                    newIndex = nu - 1;
                                }
                                props.backward.current = false;
                            }
                        }



                        $("#" + props.textureMapID).attr("src", props.activeTextureMap[newIndex]);
                        $("#voluCounterID").html("Frame: " + newIndex + " / " + (nu - 1));

                        // console.log("CustomCanvas useEffect currentIndex: " + newIndex)
                        props.currentIndex.current = newIndex;
                        if(props.refs[newIndex].current !== null) {
                            console.log("CustomCanvas useEffect currentIndex: " + newIndex)
                            const histo = props.refs[newIndex].current.getState().histogram2D;
                            const view = props.refs[newIndex].current.getState().view;
                            const mean = props.refs[newIndex].current.getState().mean;
                            const stdDev = props.refs[newIndex].current.getState().stdDev;
                            
                            if(histo.length !== 0)
                                updateHistogram(histo, mean, stdDev, view)

                            setInfo(props.refs[newIndex].current.getState().info);
                        }
                        return newIndex;
                    }
                });
            }, 1.0 / props.fps * 1000);
            return () => clearInterval(interval);
        }
    }, [props.fps]);

    return (
        <Canvas id={props.id} className={props.className} style={{"height": "calc(100% - 25px)"}}>
            {props.children}
            <Suspense fallback={null}>
                 {props.rendering.map((mesh, index) => (
                    <group key={index} visible={index === currentIndex} ref={el => meshRefs.current[index] = el}>
                        {mesh}
                    </group>
                ))}
            </Suspense>
        </Canvas>
    )
}

export default CustomCanvas;