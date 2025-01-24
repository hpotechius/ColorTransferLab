/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import * as THREE from 'three';
import {BufferAttribute} from 'three';
import React, {Suspense, useRef, useEffect, useState, useMemo } from 'react';
import {OrbitControls, PerspectiveCamera, OrthographicCamera} from "@react-three/drei"
import {Canvas} from "@react-three/fiber";
import $ from 'jquery';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { SceneFormat } from '@mkkellogg/gaussian-splats-3d';
// import { SceneFormat } from 'rendering/GaussianSplats3D/loaders/SceneFormat.js';

import "./GaussianSplatRenderer.scss"
import Axes from "rendering/Axes"
import {updateHistogram, calculateColorHistograms, calculateMeanAndStdDev} from 'Utils/Utils';
import OrbitControlNew from "rendering/OrbitControlNew";
import RendererButton from './RendererButton';
import InfoField from './InfoField';
import PointShader from 'shader/PointShader.js';
import SettingsField from './SettingsField';
import SettingsFieldItem from './SettingsFieldItem';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Renderer for Gaussian Splats (.splat, .ksplat, .ply) files.
 ******************************************************************************************************************
 ******************************************************************************************************************/
const GaussianSplatRenderer = (props) => {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [isFieldSettingVisible, setIsFieldSettingVisible] = useState(false);
    const [isFieldInfoVisible, setIsFieldInfoVisible] = useState(false);
    const [splatScale, setSplatScale] = useState(100.0);
    const [degree, setDegree] = useState(0);
    const [update, setUpdate] = useState(0);
    const [info, setInfo] = useState({});
    const [grid, changeGrid] = useState(<gridHelper args={[20,20, 0x222222, 0x222222]}/>)
    const [axis, changeAxis] = useState(<Axes />)
    const [cameraCan, setCameraCan] = useState(<PerspectiveCamera position={[4, 4, 4]} makeDefault />);
    const [perspectiveView, setPerspectiveView] = useState(true)
    const [colordistribution, setColordistribution] = useState(null)
    const [histogram3D, setHistogram3D] = useState(null)

    const isSplatVisible = useRef(true);
    const isCanvasVisible = useRef(false);
    const isHistoVisible = useRef(false);
    const isDistVisible = useRef(false);
    const containerRef = useRef(null);
    const renderer = useRef(null);
    const camera = useRef(null);
    const viewer = useRef(null);
    const refPoints = useRef(null);

    const vertexPointShader = PointShader.vertexShader
    const fragmentPointShader = PointShader.fragmentShader

    const button_settings_texture_icon = "assets/icons/icon_settings_grey.png";
    const button_settings_dist_icon = "assets/icons/icon_dist_grey.png";
    const button_settings_histo_icon = "assets/icons/icon_histogram_grey.png";
    const button_settings_info_icon = "assets/icons/icon_information.png";


    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Shader-Data
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
                pointsize: { value: 1.0}
            },
            vertexShader:vertexPointShader,
            fragmentShader:fragmentPointShader,
        }),
        []
    )

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Erstelle die Kamera
        camera.current = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);
        camera.current.position.copy(new THREE.Vector3().fromArray([-3.15634, -0.16946, -0.51552]));
        camera.current.up = new THREE.Vector3().fromArray([0, -1, -0.54]).normalize();
        camera.current.lookAt(new THREE.Vector3().fromArray([1.52976, 2.27776, 1.65898]));

        // Erstelle den Renderer
        renderer.current = new THREE.WebGLRenderer({antialias: false});
        renderer.current.setSize(width, height);
        container.appendChild(renderer.current.domElement);


        // Erstelle den Viewer
        viewer.current = new GaussianSplats3D.Viewer({
            'renderer': renderer.current,
            "camera": camera.current,
            'sphericalHarmonicsDegree': 3,
            'sharedMemoryForWorkers': false,
            "enableSIMDInSort": false,
            "useBuiltInControls": false,
        });

        // necessary to prevent the blocking of the wasd keys
        viewer.current.perspectiveControls = new OrbitControlNew(camera.current, renderer.current.domElement);

        // Event-Listener für Tastaturereignisse hinzufügen
        const handleKeyDown = (event) => {
            if (event.key === 'q' || event.key === 'Q') {
                viewer.current.splatMesh.rotation.y -= 0.1;
            } else if (event.key === 'e' || event.key === 'E') {
                viewer.current.splatMesh.rotation.y += 0.1;
            }
            else if (event.key === 'a' || event.key === 'A') {
                viewer.current.splatMesh.rotation.x -= 0.1;
            } else if (event.key === 'd' || event.key === 'D') {
                viewer.current.splatMesh.rotation.x += 0.1;
            }
            else if (event.key === 'w' || event.key === 'W') {
                viewer.current.splatMesh.rotation.z -= 0.1;
            } else if (event.key === 's' || event.key === 'S') {
                viewer.current.splatMesh.rotation.z += 0.1;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Bereinige den Renderer bei der Demontage der Komponente
        return () => {
            container.removeChild(renderer.current.domElement);
        };
    }, []);

    /**************************************************************************************************************
     * Renders new object if a new file is loaded
     **************************************************************************************************************/
    useEffect(() => {
        if (props.filePath !== null) {
            isSplatVisible.current = true;
            isCanvasVisible.current = false;
            isHistoVisible.current = false;
            isDistVisible.current = false;

            // file name should be in the format "filename-ksplat.gsp"
            // gsp has to be removed and the "-" has to be replaced by "."
            let filePath_ext = props.filePath//.split(".")[0].replace("-", ".");
            let filePath = filePath_ext.split(".")[0]
            let fileExt = filePath_ext.split(".")[1]
            let format = null
            if (fileExt === "ksplat") {
                format = SceneFormat.KSplat
            } else if (fileExt === "splat") {
                format = SceneFormat.Splat
            } else if (fileExt === "ply") {
                format = SceneFormat.Ply
            } else {
                console.error("File format not supported")
            }

            viewer.current.removeSplatScene(0);

            waitForViewerToBeReady(viewer, () => {
                viewer.current.addSplatScene(filePath, {
                    "showLoadingUI": false,
                    "format": format,
                    onProgress: (progress) => {
                        // Update the progress bar
                        const renderbarprocessingid = props.renderBarID + "_processing"
                        const renderbartextid = props.renderBarID + "_text"
                        $(`#${props.renderBarID}`).css("display", "flex")
                        $(`#${renderbarprocessingid}`).css("width", Math.round(progress).toString() + "%")
                        $(`#${renderbartextid}`).html("Processing...");
                    }})
                    .then(() => {
                        requestAnimationFrame(update);
                        props.setComplete(Math.random())

                        const renderbarprocessingid = props.renderBarID + "_processing"
                        const renderbartextid = props.renderBarID + "_text"
                        $(`#${props.renderBarID}`).css("display", "none")
                        $(`#${renderbarprocessingid}`).css("width", "0%")
                        $(`#${renderbartextid}`).html("");

                        const pixelArray = viewer.current.splatMesh.splatDataTextures.baseData.colors

                        const histograms = calculateColorHistograms(pixelArray, false, 4)
                        const { mean, stdDev } = calculateMeanAndStdDev(pixelArray, false, 4);
                        updateHistogram(histograms[0], mean, stdDev, props.view)

                        setHistogram3D(histograms[1])

                        let colors_buf = new Float32Array(pixelArray)
   
                        // Removal of every fourth value from colors_buf and division of the remaining values by 255
                        const filteredColorsBuf = colors_buf
                            .filter((_, index) => (index + 1) % 4 !== 0)
                            .map(value => value / 255);
                        setColordistribution(new BufferAttribute(new Float32Array(filteredColorsBuf), 3))

                        setInfo({"#Vertices": pixelArray.length / 3 })
                    });
            });

            function waitForViewerToBeReady(viewer, callback) {
                if (!viewer.current.isLoadingOrUnloading()) {
                    callback();
                } else {
                    setTimeout(() => waitForViewerToBeReady(viewer, callback), 100); // Überprüfe alle 100ms
                }
            }
    
            function update() {
                requestAnimationFrame(update);
                renderer.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
                camera.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
                camera.current.updateProjectionMatrix();
                viewer.current.update();
                viewer.current.render();
            }
        }
    }, [props.filePath]);

    /**************************************************************************************************************
     * Change Splatscale
     **************************************************************************************************************/
    useEffect(() => {
        if (viewer.current !== null && viewer.current.splatMesh !== undefined) {
            // the initial execution of this function will fail because the splatMesh is not yet created
            try {viewer.current.splatMesh.setSplatScale(splatScale / 100.0);}
            catch (e) {}
        }
    }, [splatScale]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * Shows the settings field for the renderer.
     * (1) Degree of the spherical harmonics
     * (2) Splat scale
     **************************************************************************************************************/
    const showSettings = () => {
        setIsFieldSettingVisible(!isFieldSettingVisible);
    };

    /**************************************************************************************************************
     * Changes the degree of the spherical harmonics.
     * Values between 0 and 3 are allowed.
     **************************************************************************************************************/
    const handleDegreeChange = (e) => {
        setDegree(e.target.value);
        console.log(degree)
    };

    /**************************************************************************************************************
     * Changes the splat scale.
     * Values between 0 and 100 are allowed.
     **************************************************************************************************************/
    const handleSplatScaleChange = (e) => {
        setSplatScale(e.target.value);
    };

    /**************************************************************************************************************
     * Switches between the gaussian splat view and the 3D color histogram view.
     **************************************************************************************************************/
    const switchColorHistogram = () => {
        isHistoVisible.current = !isHistoVisible.current;

        if (!isDistVisible.current) {
            isSplatVisible.current = !isSplatVisible.current;
            isCanvasVisible.current = !isCanvasVisible.current;
        }

        isDistVisible.current = false;
        setUpdate(Math.random())
    }

    /**************************************************************************************************************
     * Shows the information field of the current object.
     * (1) Number of vertices
     **************************************************************************************************************/
    const showInfo = () => {
        setIsFieldInfoVisible(!isFieldInfoVisible);

        // Hide the settings field if the info field is visible
        // Note that isFieldInfoVisible has to be false, because the state is not updated immediately
        if(!isFieldInfoVisible)
            setIsFieldSettingVisible(false)
    }

    /**************************************************************************************************************
     * Switches between the gaussian splat view and the 3D color distribution view.
     **************************************************************************************************************/
    const switchColorDistribution = () => {
        isDistVisible.current = !isDistVisible.current;
        
        if (!isHistoVisible.current) {
            isSplatVisible.current = !isSplatVisible.current;
            isCanvasVisible.current = !isCanvasVisible.current;
        }

        isHistoVisible.current = false;
        setUpdate(Math.random())
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return(
        <div id={props.id} className="gaussianSplatRenderer">

            {/* Header of the renderer containing buttons for changing the output of the render view*/}
            <div className="rendererbutton-container">
                {/* Button for showing object information */}
                <RendererButton onClick={showInfo} src={button_settings_info_icon}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorHistogram} src={button_settings_histo_icon}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorDistribution} src={button_settings_dist_icon}/>
                {/* Button for showing the settings for the mesh view */}
                <RendererButton onClick={showSettings} src={button_settings_texture_icon}/>
            </div>

            <div className="gaussiansplat" ref={containerRef} style={
                {
                    display: isSplatVisible.current ? "block" : "none"
                }
            }></div>

            {/* Canvas for rendering the color distribution */}
            <Canvas 
                    id={props.id} 
                    className={props.className} 
                    style={{
                        "height": "calc(100% - 25px)", 
                        display: isCanvasVisible.current ? "block" : "none"
                    }}
                >
                <ambientLight/>
                <OrbitControls />
                {cameraCan}
                {grid}
                {axis}
                <Suspense fallback={null}>
                    {isHistoVisible.current && <group>{histogram3D}</group>}
                    {isDistVisible.current && 
                        <points
                            key={Math.random} 
                            ref={refPoints} 
                        >
                            <bufferGeometry>
                                <bufferAttribute attach={"attributes-position"} {...colordistribution} />
                                <bufferAttribute attach={"attributes-color"} {...colordistribution} />
                            </bufferGeometry>
                            <shaderMaterial attach="material" args={[data]} />
                        </points>}
                </Suspense>
            </Canvas> 

            {/* Information field of the current object. Show for point clouds the number of vertices, etc. */}
            <InfoField visibility={isFieldInfoVisible}>
                {info}
            </InfoField>

            {/* Settings field */}
            <SettingsField visibility={isFieldSettingVisible}>
                <SettingsFieldItem type={"range"} min="0" max="3" value={degree} onChange={handleDegreeChange}>Degree</SettingsFieldItem>
                <SettingsFieldItem type={"range"} min="0" max="100" value={splatScale} onChange={handleSplatScaleChange}>Splat Scale</SettingsFieldItem>
            </SettingsField>
        </div>
    )
};

export default GaussianSplatRenderer;