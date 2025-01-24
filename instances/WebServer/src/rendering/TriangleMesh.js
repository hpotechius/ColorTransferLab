/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import $ from 'jquery';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader'
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader'
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";
import {BufferAttribute} from 'three';

import {updateHistogram, calculateColorHistograms, calculateMeanAndStdDev,loadTextureAndConvertToArray} from 'Utils/Utils';
import MeshShader from 'shader/MeshShader.js';
import PointShader from 'shader/PointShader.js';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
 const TriangleMesh = forwardRef((props, ref) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
     const [state, setState] = useState({
        pointsize: 1,
        wireframe: false,
        colordistribution: false,
        faceNormals: false,
        colorhistogram: false,
        histogram2D: [],
        mean: [0,0,0],
        stdDev: [0,0,0],
        view: props.view,
        info: {
            "#Vertices": 0,
            "#Faces": 0
        }
    });

    const [textureloaded, setTextureloaded] = useState(false)
    const [complete, setComplete] = useState(false)
    const [mesh, setMesh] = useState(null)

    const histogram3D = useRef([]);
    let center = useRef(new THREE.Vector3(0,0,0))
    let scaling = useRef(1.0)
    const refTriangleMesh = useRef()
    const colors = useRef(new BufferAttribute(new Float32Array(0), 3))
    const refPoints = useRef()

    // defines if this is a single Mesh or part of a Volumetric Video
    //const type = props.type

    const vertexShader = MeshShader.vertexShader
    const fragmentShader = MeshShader.fragmentShader
    const vertexPointShader = PointShader.vertexShader
    const fragmentPointShader = PointShader.fragmentShader

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
     * 
     **************************************************************************************************************/
    useFrame(() => {
        if(refTriangleMesh.current) {
            refTriangleMesh.current.material.wireframe = state.wireframe
            refTriangleMesh.current.material.uniforms.faceNormal = {value: state.faceNormal}
            refTriangleMesh.current.material.uniforms.enableColorDistribution = {value: state.colordistribution}
        }
        if(refPoints.current) {
            refPoints.current.material.uniforms.pointsize = {value: state.pointsize}
        }
    })

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        loadModel(props.file_name, props);
    }, []);

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
            Shininess: { value: 1.0 },
            enableNormalColor: { value: false },
            enableColorDistribution: { value: true },
            pointsize: { value: 1.0 }
          },
          vertexShader:vertexPointShader,
          fragmentShader:fragmentPointShader,
          
        }),
        []
    )

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const loadMTL = (fileName, png_urlname) => {
        return new Promise((resolve, reject) => {
            const mtlLoader = new MTLLoader();
            mtlLoader.load(
                fileName,
                (mtl) => {
                    const mapName = Object.keys(mtl.materialsInfo)[0];
                    mtl.materialsInfo[mapName].map_kd = png_urlname;
                    mtl.preload();
                    resolve(mtl);


                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    };
    
    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const loadOBJ = (fileName) => {
        return new Promise((resolve, reject) => {
            const objLoader = new OBJLoader();
            objLoader.load(
                fileName,
                (obj) => {
                    resolve(obj);

                    const renderbarprocessingid = props.renderBar + "_processing"
                    const renderbartextid = props.renderBar + "_text"
                    $(`#${props.renderBar}`).css("display", "none")
                    $(`#${renderbarprocessingid}`).css("width", "0%")
                    $(`#${renderbartextid}`).html("");


                },
                (xhr) => {
                    var progress = ( xhr.loaded / xhr.total * 100 );

                    const renderbarprocessingid = props.renderBar + "_processing"
                    const renderbartextid = props.renderBar + "_text"
                    $(`#${props.renderBar}`).css("display", "flex")
                    $(`#${renderbarprocessingid}`).css("width", progress.toString() + "%")
                    $(`#${renderbartextid}`).html("Processing...");
                },
                (error) => {
                    reject(error);
                }
            );
        });
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const loadModel = async (fileName, props) => {
        try {
            const png_urlname = fileName[0].split("/").pop()
            const [mtl, obj] = await Promise.all([loadMTL(fileName[1], png_urlname), loadOBJ(fileName[2])]);

            // Set the material to the OBJ model
            obj.traverse((child) => {
                if (child.isMesh) {
                    child.material = mtl.materials[child.material.name];
                }
            });

            const shaderMaterial = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTexture: { value: obj.children[0].material.map }
                },
                wireframe: state.wireframe
            });

            let currMesh = obj.children[0];
            currMesh.material = shaderMaterial;
    
            setMesh(currMesh);
    
            obj.children[0].geometry.computeBoundingSphere();
            var cen= obj.children[0].geometry.boundingSphere.center;
            var radius = obj.children[0].geometry.boundingSphere.radius;
            var sca = 1.0 / radius;
            center.current = [-cen.x*sca, -cen.y*sca + 1.0, -cen.z*sca];
            scaling.current = sca;

            // Texture maps of volumetric video meshes are in jpg format and maps of single meshes are in png format
            let file_extension = ".png"
            if (props.type === "VolumetricVideo") {
                file_extension = ".jpg"
            } 

            const textureUrl = fileName[0];
            loadTextureAndConvertToArray(textureUrl, (pixelArray) => {
                // set the histogram data for 2D and 3D rendering
                const histograms = calculateColorHistograms(pixelArray, false, 4)
                const { mean, stdDev } = calculateMeanAndStdDev(pixelArray, false, 4);

                setState(prevState => ({
                    ...prevState,
                    histogram2D: histograms[0],
                    mean: mean,
                    stdDev: stdDev
                }));

                histogram3D.current = histograms[1]
                updateHistogram(histograms[0], mean, stdDev, props.view)

                let colors_buf = new Float32Array(pixelArray)
                // Remove every fourth value from colors_buf and divide the remaining values by 255
                const filteredColorsBuf = colors_buf
                    .filter((_, index) => (index + 1) % 4 !== 0)
                    .map(value => value / 255);

                colors.current = new BufferAttribute(new Float32Array(filteredColorsBuf), 3);

                setTextureloaded(true)
 
            });

            // Update the info field
            setState(prevState => ({
                ...prevState,
                info: {
                    ...prevState.info,
                    "#Faces": obj.children[0].geometry.attributes.position.count / 3,
                    "#Vertices": (obj.children[0].geometry.attributes.position.count / 3 / 2) + 2
                }
            }));


            setComplete(true);
            props.setGLOComplete(Math.random());
        } catch (error) {
            console.error('An error happened', error);
        }
    };

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    if(!complete || !textureloaded) {
        return (
            <group position={[0,0,0]} scale={1}/>
        )
    } else {
        return (
            <>
                {state.colorhistogram ? (
                    <group> 
                        {histogram3D.current}
                    </group>
                    ) : null
                }
                {state.colordistribution ? (
                        <points
                            key={Math.random} 
                            ref={refPoints} 
                        >
                            <bufferGeometry>
                                <bufferAttribute attach={"attributes-position"} {...colors.current} />
                                <bufferAttribute attach={"attributes-color"} {...colors.current} />
                            </bufferGeometry>
                            <shaderMaterial attach="material" args={[data]} />
                        </points>) 
                        : null
                }
                {!state.colordistribution && ! state.colorhistogram ? (
                        <group position={center.current} scale={scaling.current}>
                            {mesh && mesh.geometry && mesh.material && (
                                <mesh ref={refTriangleMesh} geometry={mesh.geometry} material={mesh.material} dispose={null} />
                            )}
                        </group>
                    ) : null
                }
            </>
        )
    } 
})

export default TriangleMesh;