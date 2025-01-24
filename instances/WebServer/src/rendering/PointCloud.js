/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

/*
Reference for point cloud rendering: https://codesandbox.io/p/sandbox/points-ldpyw8?file=%2Fsrc%2Findex.js%3A14%2C12-14%2C56
*/

import React, {useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import {BufferAttribute} from "three";
import {useFrame} from "@react-three/fiber";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import * as THREE from 'three'

import PointShader from "shader/PointShader"
import { updateHistogram, calculateColorHistograms, calculateMeanAndStdDev } from 'Utils/Utils';
import $ from 'jquery';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
const PointCloud = forwardRef((props, ref) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [state, setState] = useState({
        pointsize: 1,
        colornormal: false,
        colordistribution: false,
        colorhistogram: false,
        histogram2D: [],
        mean: [0,0,0],
        stdDev: [0,0,0],
        view: props.view,
        info: {
            "#Vertices": 0
        }
    });

    const [complete, setComplete] = useState(false)

    let coords = useRef(new Float32Array(0))
    let normals = useRef(new Float32Array(0))
    let colors = useRef(new Float32Array(0))
    let position = useRef(new THREE.Vector3(0,0,0))
    let scaling = useRef(1.0)
    let center = useRef(new THREE.Vector3(0,0,0))
    let refPoints = useRef()
    const histogram3D = useRef([]);

    const vertexShader = PointShader.vertexShader
    const fragmentShader = PointShader.fragmentShader

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
    }));

    /**************************************************************************************************************
     * Update the point size, color normal and color distribution each frame.
     **************************************************************************************************************/
    useFrame(() => {
        if(complete && refPoints.current) {
            refPoints.current.material.uniforms.pointsize = {value: state.pointsize}
            refPoints.current.material.uniforms.enableNormalColor = {value: state.colornormal}
            refPoints.current.material.uniforms.enableColorDistribution = {value: state.colordistribution}
        }
    })

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    let data = useMemo(
        () => ({
          uniforms: {
            Ka: { value: new THREE.Vector3(1, 1, 1) },
            Kd: { value: new THREE.Vector3(1, 1, 1) },
            Ks: { value: new THREE.Vector3(1, 1, 1) },
            LightIntensity: { value: new THREE.Vector4(0.5, 0.5, 0.5, 1.0) },
            LightIntensity: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
            LightPosition: { value: new THREE.Vector4(0.0, 2000.0, 0.0, 1.0) },
            Shininess: { value: 1.0 }
          },
          vertexShader,
          fragmentShader,
          
        }),
        []
    )

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        const loader = new PLYLoader();
        // load a resource
        loader.load(
            // resource URL
            props.file_path,
            // called when resource is loaded
            function ( obj ) {
                // calculate scaling factor to fit object into unit cube
                var boundingBox = new THREE.Box3();
                obj.computeBoundingBox();
                boundingBox.copy( obj.boundingBox );
            
                center.current = new THREE.Vector3(boundingBox.min.x + (boundingBox.max.x - boundingBox.min.x ) / 2.0, 
                                               boundingBox.min.y + (boundingBox.max.y - boundingBox.min.y ) / 2.0, 
                                               boundingBox.min.z + (boundingBox.max.z - boundingBox.min.z ) / 2.0)
            
                var radius = (obj.boundingBox.max.y - obj.boundingBox.min.y ) / 2.0

                position.current = new THREE.Vector3(-center.current.x*scaling.current, -center.current.y*scaling.current + 1.0, -center.current.z*scaling.current)
                scaling.current = 1.0 / radius

                let coord_buf = new Float32Array(obj.attributes.position.array)
                coords.current = new BufferAttribute(coord_buf, 3);
                let normals_buf = new Float32Array(obj.attributes.normal.array)
                normals.current = new BufferAttribute(normals_buf, 3);
                let colors_buf = new Float32Array(obj.attributes.color.array)
                colors.current = new BufferAttribute(colors_buf, 3);
                console.debug("%c[INFO] Loaded point cloud with " + coord_buf.length / 3 + " vertices:", "color: orange", {"Coordinates": coords.current, "Normals": normals.current, "Colors": colors.current})

                setState(prevState => ({
                    ...prevState,
                    info: {
                        ...prevState.info,
                        "#Vertices": coord_buf.length / 3
                    }
                }));

                // Sacling the color values from 0-1 to 0-255
                // Calculate the mean and standard deviation for each channel
                const { mean, stdDev } = calculateMeanAndStdDev(colors.current.array, true, 3);

                // set the histogram data for 2D and 3D rendering
                const histograms = calculateColorHistograms(colors.current.array, true, 3);

                setState(prevState => ({
                    ...prevState,
                    histogram2D: histograms[0],
                    mean: mean,
                    stdDev: stdDev
                }));

                histogram3D.current = histograms[1]
                updateHistogram(histograms[0], mean, stdDev, props.view)

                // Resets the progress bar after loading is complete
                const renderbarprocessingid = props.renderBar + "_processing"
                const renderbartextid = props.renderBar + "_text"
                $(`#${props.renderBar}`).css("display", "none")
                $(`#${renderbarprocessingid}`).css("width", "0%")
                $(`#${renderbartextid}`).html("");

                setComplete(true)
                props.setGLOComplete(Math.random())
                
            },
            // called when loading is in progresses
            function ( xhr ) {
                var progress = ( xhr.loaded / xhr.total * 100 );
                const renderbarprocessingid = props.renderBar + "_processing"
                const renderbartextid = props.renderBar + "_text"
                $(`#${props.renderBar}`).css("display", "flex")
                $(`#${renderbarprocessingid}`).css("width", progress.toString() + "%")
                $(`#${renderbartextid}`).html("Processing...");
            },
            // called when loading has errors
            function ( error ) {
                console.log(error)
                console.log( 'An error happened' );

            }
        );
    }, [])

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    if(!complete) {
        return (
            <group position={[0,0,0]} scale={1}/>
        )
    } else {
        return(
            <>
            {state.colorhistogram ? (
                <group> 
                    {histogram3D.current}
                </group>
            ) : (
                <points 
                    key={Math.random} 
                    ref={refPoints} 
                    {...(state.colordistribution ? {} : { position: position.current, scale: scaling.current })}
                >
                    <bufferGeometry>
                        <bufferAttribute attach={"attributes-position"} {...coords.current} />
                        <bufferAttribute attach={"attributes-normal"} {...normals.current} />
                        <bufferAttribute attach={"attributes-color"} {...colors.current} />
                    </bufferGeometry>
                    <shaderMaterial attach="material" {...data} />
                </points>
            )}
            </>
        );
    }
});

export default PointCloud;
