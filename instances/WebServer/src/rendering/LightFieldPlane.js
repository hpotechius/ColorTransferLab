/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {BufferAttribute} from 'three';

import LightFieldShader from "shader/LightFieldShader.js";
import { updateHistogram, calculateColorHistograms, calculateMeanAndStdDev } from 'Utils/Utils';


// Vertex and Fragment shaders
const vertexShader = LightFieldShader.vertexShader
const fragmentShader = LightFieldShader.fragmentShader


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Plane for rendering the light field.
 ******************************************************************************************************************
 ******************************************************************************************************************/
const LightFieldPlane = forwardRef(({ camsX, camsY, width, height, cameraGap, fieldTexture, aperture, focus, stInput,cameraRef, view }, ref) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
     const [state, setState] = useState({
        histogram3D: [],
        colordistribution: [],
        info: {
            "width": 0,
            "height": 0,
            "channels": 0
        }
    });

    const planeRef = useRef();
    const planePtsRef = useRef();
    const { scene, gl} = useThree();

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
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
        captureShaderOutput: () => {
            // // Render the scene to a render target
            const renderTarget = new THREE.WebGLRenderTarget(width, height);
            gl.setRenderTarget(renderTarget);
            gl.render(scene, cameraRef.current);

            // Read the pixel data from the render target
            const pixelBuffer = new Uint8Array(width * height * 4);
            gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixelBuffer);

            const { mean, stdDev } = calculateMeanAndStdDev(pixelBuffer, false, 4);
            // set the histogram data for 2D and 3D rendering
            const histograms = calculateColorHistograms(pixelBuffer, false, 4);

            let colors_buf = new Float32Array(pixelBuffer)
            // Remove every fourth value from colors_buf and divide the remaining values by 255
            const filteredColorsBuf = colors_buf
                .filter((_, index) => (index + 1) % 4 !== 0)
                .map(value => value / 255);

            setState(prevState => ({
                ...prevState,
                histogram3D: histograms[1],
                colordistribution: new BufferAttribute(new Float32Array(filteredColorsBuf), 3),
                info: {
                    width: 0,
                    height: 0,
                    channels: 0
                }
            }));

            updateHistogram(histograms[0], mean, stdDev, view)
            
            // Reset the render target to null
            gl.setRenderTarget(null);
            
        }
    }));

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        if(fieldTexture !== null) {
            const planeGeo = new THREE.PlaneGeometry(camsX * cameraGap, camsY * cameraGap, camsX, camsY);

            const planeMat = new THREE.ShaderMaterial({
                uniforms: {
                    aspect: { value: height / width },
                    field: { value: fieldTexture },
                    camArraySize: new THREE.Uniform(new THREE.Vector2(camsX, camsY)),
                    aperture: { value: aperture },
                    focus: { value: focus }
                },
                vertexShader,
                fragmentShader,
            });

            const plane = new THREE.Mesh(planeGeo, planeMat);
            // the plane is square, so we need to scale it to the correct aspect ratio
            planeRef.current = plane;

            const ptsMat = new THREE.PointsMaterial({ size: 0.01, color: 0xeeccff });
            const planePts = new THREE.Points(planeGeo, ptsMat);
  
            planePts.visible = stInput;
            planePtsRef.current = planePts;

            plane.add(planePts);
            scene.add(plane);

            // Initial capture
            ref.current.captureShaderOutput();

            return () => {
                scene.remove(plane);
            };
        }

    }, [camsX, camsY, cameraGap, fieldTexture, aperture, focus, stInput, scene]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return null;

});

export default LightFieldPlane;