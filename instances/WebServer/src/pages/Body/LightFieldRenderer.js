/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.

NOTE:
Conversion of multiple pngs to mp4: 
    ffmpeg -framerate 30 -i image%03d.png -c:v libx264 -pix_fmt yuv420p output.mp4
Reduce video size:
    ffmpeg -i '/home/potechius/Downloads/rectified/output.mp4' -vf scale=512:-1 -c:a copy '/home/potechius/Downloads/outputmedium.mp4'
*/

import React, {Suspense, useState, useEffect, useRef, useMemo} from 'react';
import {OrbitControls, PerspectiveCamera, OrthographicCamera} from "@react-three/drei"
import $ from 'jquery';
import * as THREE from 'three';
import {Canvas} from "@react-three/fiber";

import Axes from "rendering/Axes"
import './LightFieldRenderer.scss';
import LightFieldPlane from 'rendering/LightFieldPlane';
import RendererButton from './RendererButton';
import PointShader from 'shader/PointShader.js';
import InfoField from './InfoField';
import SettingsField from './SettingsField';
import SettingsFieldItem from './SettingsFieldItem';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Light field renderer for displaying light field videos in mp4 format.
 ******************************************************************************************************************
 ******************************************************************************************************************/
const LightFieldRenderer = (props) => {    
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [isFieldSettingVisible, setIsFieldSettingVisible] = useState(false);
    const [focus, setFocus] = useState(0.0);
    const [aperture, setAperture] = useState(5.0);
    const [stInput, setStInput] = useState(false);
    const [isFieldInfoVisible, setIsFieldInfoVisible] = useState(false);
    const [info, setInfo] = useState({});
    const [grid, changeGrid] = useState(<gridHelper args={[20,20, 0x222222, 0x222222]}/>)
    const [axis, changeAxis] = useState(<Axes />)
    const [camera, setCamera] = useState(null);
    const [perspectiveView, setPerspectiveView] = useState(true)
    const [update, setUpdate] = useState(0);
    const [fieldTexture, setFieldTexture] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const refPoints = useRef(null);
    // const pixelBuffer = useRef(null);
    const controlsRef = useRef();
    const cameraRef = useRef();
    const isImageVisible = useRef(true);
    const isCanvasVisible = useRef(false);
    const isHistoVisible = useRef(false);
    const isDistVisible = useRef(false);
    const planeRef = useRef();

    const camsX = 17;
    const camsY = 17;
    const width = useRef(1.0);
    const height = useRef(1.0);
    const cameraGap = 0.1;

    const vertexPointShader = PointShader.vertexShader
    const fragmentPointShader = PointShader.fragmentShader
    
    const button_settings_texture_icon = "assets/icons/icon_settings_grey.png";

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        const loadVideo = async (data) => {
            const camsX = data.grid_width;
            const camsY = data.grid_height;
            const resX = data.img_width;
            const resY = data.img_height;
            width.current = resX;
            height.current = resY;
            extractVideo(props.filePath[1], resX, resY, camsX, camsY, setFieldTexture, props.renderBarID, props.setComplete);

            setInfo({
                "width": resX,
                "height": resY,
                "#cams in x": camsX,
                "#cams in y": camsY
            })
        };
        
        if (props.filePath !== null) {
            // read JSON file with lightfield meta data
            const json_path = props.filePath[0];

            const loadJson = async () => {
                try {
                    const response = await fetch(json_path);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    loadVideo(data);
                } catch (error) {
                    console.error("Error loading JSON:", error);
                }
            };
            loadJson();
        }

    }, [props.filePath]);

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
     * Switch between perspective and orthographic view
     **************************************************************************************************************/
    useEffect(() => {
        if (perspectiveView) {
            setCamera(<PerspectiveCamera position={[4, 4, 4]} makeDefault />)
        } else {
            setCamera(<OrthographicCamera position={[10, 10, 10]} zoom={40} makeDefault />);
        }
    }, [perspectiveView]);


    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * If the camera orientation changes, the color data of the light field renderer has to be updated.
     * To reduce the number of updates, the update is triggered with a delay of 1 second.
     **************************************************************************************************************/
    const handleCameraChange = () => {
        if (controlsRef.current) {
            if (planeRef.current && !isWaiting) {
                setIsWaiting(true);
                setTimeout(() => {
                    planeRef.current.captureShaderOutput();
                    setIsWaiting(false);
                }, 1000);
            }
        }
    };

    /**************************************************************************************************************
     * Show the settings for the light field renderer
     * (1) Focus
     * (2) Aperture
     * (3) Show ST Plane
     **************************************************************************************************************/
    const showSettings = () => {
        setIsFieldSettingVisible(!isFieldSettingVisible);
    };

    /**************************************************************************************************************
     * Updates the focus value of the light field renderer.
     * Focus is in the range of -0.01 to 0.01.
     **************************************************************************************************************/
    const handleFocusChange = (e) => {
        setFocus(e.target.value / 10000.0);
    }

    /**************************************************************************************************************
     * Updates the aperture value of the light field renderer
     * Aperture is in the range of 1.0 to 10.0.
     **************************************************************************************************************/
    const handleApertureChange = (e) => {
        setAperture(e.target.value / 10.0);
    }

    /**************************************************************************************************************
     * Visualize the camera positions of the individual cameras in the light field.
     **************************************************************************************************************/
    const handlePlaneChange = (e) => {
        setStInput(!stInput);
    }

    /**************************************************************************************************************
     * The Light Field is stored as a video in mp4 format. The video is extracted and the frames are stored in a
     * texture. The texture is used for rendering the light field.
     **************************************************************************************************************/
    const extractVideo = (filename, resX, resY, camsX, camsY, setFieldTexture, renderBarID, setComplete) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = resX;
        canvas.height = resY;
        let seekResolve;
        let count = 0;
        let offset = 0;
        const allBuffer = new Uint8Array(resX * resY * 4 * camsX * camsY);

        const getBufferFromVideo = () => {
            ctx.drawImage(video, 0, 0, resX, resY);
            const imgData = ctx.getImageData(0, 0, resX, resY);

            allBuffer.set(imgData.data, offset);
            offset += imgData.data.byteLength;
            count++;
            let progress = Math.round(100 * count / (camsX * camsY));

            const renderbarprocessingid = renderBarID + "_processing"
            const renderbartextid = renderBarID + "_text"
            $(`#${renderBarID}`).css("display", "flex")
            $(`#${renderbarprocessingid}`).css("width", progress.toString() + "%")
            $(`#${renderbartextid}`).html("Processing...");
        };
      
        const fetchFrames = async () => {
            let currentTime = 0;
      
            while (count < camsX * camsY) {
                getBufferFromVideo();
                currentTime += 0.0333;
                video.currentTime = currentTime;
                await new Promise(res => (seekResolve = res));
            }

            const fieldTexture = new THREE.DataArrayTexture(allBuffer, resX, resY, camsX * camsY);

            fieldTexture.needsUpdate = true;
            setFieldTexture(fieldTexture);
        };
      
        video.addEventListener('seeked', async function() {
            if (seekResolve) seekResolve();
        });
      
        video.addEventListener('loadeddata', async () => {
            await fetchFrames();
            console.debug("%c[INFO] LightField loaded", "color: orange;")
        
            setComplete(Math.random());
            const renderbarprocessingid = renderBarID + "_processing"
            $(`#${renderbarprocessingid}`).css("width", "0%")
            $(`#${renderBarID}`).css("display", "none")
        });
      
        video.crossOrigin = 'anonymous';
        video.src = filename;
    }

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    // const handleColorDataReady = (pixelData) => {
    //     pixelBuffer.current = pixelData;
    // };

    /**************************************************************************************************************
     * Switch between Light Field view and Color Distribution view
     **************************************************************************************************************/
    const switchColorDistribution = () => {
        isDistVisible.current = !isDistVisible.current;
        
        if (!isHistoVisible.current) {
            isImageVisible.current = !isImageVisible.current;
            isCanvasVisible.current = !isCanvasVisible.current;
        }

        isHistoVisible.current = false;
        setUpdate(Math.random())
    }

    /**************************************************************************************************************
     * Switch between Light Field view and 3D Color Histogram view
     **************************************************************************************************************/
    const switchColorHistogram = () => {
        isHistoVisible.current = !isHistoVisible.current;

        if (!isDistVisible.current) {
            isImageVisible.current = !isImageVisible.current;
            isCanvasVisible.current = !isCanvasVisible.current;
        }

        console.log(isImageVisible.current)
        isDistVisible.current = false;
        setUpdate(Math.random())
    }
    /**************************************************************************************************************
     * Show object information
     * (1) Width
     * (2) Height
     * (3) Number of cameras in x
     * (4) Number of cameras in y
     **************************************************************************************************************/
    const showObjectInfo = (e) => {
        setIsFieldInfoVisible(!isFieldInfoVisible);
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className="renderer_lightfield">
            {/* Header of the renderer containing buttons for changing the output of the render view*/}
            <div className="rendererbutton-container">
                {/* Button for showing the object infos */}
                <RendererButton onClick={showObjectInfo} src={"assets/icons/icon_information.png"}/>
                {/* Button for showing the settings for the mesh view */}
                <RendererButton onClick={showSettings} src={button_settings_texture_icon}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorHistogram} src={"assets/icons/icon_histogram_grey.png"}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorDistribution} src={"assets/icons/icon_dist_grey.png"}/>
            </div>

            <Canvas
                style={{
                    display: isImageVisible.current ? "block" : "none",
                    height: "calc(100% - 25px)",
                    backgroundColor: "black"
                }}
            >
                <LightFieldPlane
                    ref={planeRef}
                    camsX={camsX}
                    camsY={camsY}
                    width={width.current}
                    height={height.current}
                    cameraGap={cameraGap}
                    fieldTexture={fieldTexture}
                    aperture={aperture}
                    focus={focus}
                    stInput={stInput}    
                    cameraRef={cameraRef}
                    view={props.view}
                />
                <OrbitControls 
                    enableDamping={true}
                    dampingFactor={0.25}
                    target={[0, 0, 1]}
                    ref={controlsRef}
                    onChange={handleCameraChange}
                />
                <PerspectiveCamera 
                    position={[0, 0, 1.5]} 
                    fov={45}
                    ref={cameraRef}
                    makeDefault 
                />

            </Canvas>


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
                {camera}
                {grid}
                {axis}
                <Suspense fallback={null}>
                    {isHistoVisible.current && <group>{planeRef.current.getState().histogram3D}</group>}
                    {isDistVisible.current && 
                        <points
                            key={Math.random} 
                            ref={refPoints} 
                        >
                            <bufferGeometry>
                                <bufferAttribute attach={"attributes-position"} {...planeRef.current.getState().colordistribution} />
                                <bufferAttribute attach={"attributes-color"} {...planeRef.current.getState().colordistribution} />
                            </bufferGeometry>
                            <shaderMaterial attach="material" args={[data]} />
                        </points>}
                </Suspense>
            </Canvas>

            {/* Information field of the current object. Shows the width and height etc. */}
            <InfoField visibility={isFieldInfoVisible}>
                {info}
            </InfoField>

            {/* Settings field */}
            <SettingsField visibility={isFieldSettingVisible}>
                <SettingsFieldItem type={"range"} min="-100" max="100" value={focus * 10000.0} onChange={handleFocusChange}>Focus</SettingsFieldItem>
                <SettingsFieldItem type={"range"} min="0" max="100" value={aperture * 10.0} onChange={handleApertureChange}>Aperture</SettingsFieldItem>
                <SettingsFieldItem type={"checkbox"} default={stInput} onChange={handlePlaneChange}>Show ST Plane</SettingsFieldItem>
            </SettingsField>
        </div>
    )
};

export default LightFieldRenderer;