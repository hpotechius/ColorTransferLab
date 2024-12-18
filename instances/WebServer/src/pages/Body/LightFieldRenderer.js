/*
Copyright 2024 by Herbert Potechius,
Tehnical University of Berlin, Faculty IV - Electrical Engineering and Computer Science
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
import {Canvas} from "@react-three/fiber";
import Axes from "rendering/Axes"
import './LightFieldRenderer.scss';
import LightFieldPlane from 'rendering/LightFieldPlane';
import $ from 'jquery';
import * as THREE from 'three';
import RendererButton from './RendererButton';
import PointShader from 'shader/PointShader.js';
import { use } from 'react';
import { updateHistogram, calculateColorHistograms, calculateMeanAndStdDev } from 'Utils/Utils';
import {BufferAttribute} from 'three';
import InfoField from './InfoField';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
const LightFieldRenderer = (props) => {    
    const [isFieldSettingVisible, setIsFieldSettingVisible] = useState(true);
    const [focus, setFocus] = useState(0.0);
    const [aperture, setAperture] = useState(5.0);
    const [stInput, setStInput] = useState(false);

    const [isFieldInfoVisible, setIsFieldInfoVisible] = useState(false);

    const [info, setInfo] = useState({});

    const refPoints = useRef(null);

    const [grid, changeGrid] = useState(<gridHelper args={[20,20, 0x222222, 0x222222]}/>)
    const [axis, changeAxis] = useState(<Axes />)
    const [camera, setCamera] = useState(null);
    const [perspectiveView, setPerspectiveView] = useState(true)

    const [update, setUpdate] = useState(0);
    const [fieldTexture, setFieldTexture] = useState(null);

    const pixelBuffer = useRef(null);

    const [cameraMoved, setCameraMoved] = useState(false);
    const controlsRef = useRef();
    const cameraRef = useRef();

    const pixelData = useRef(null);

    const isImageVisible = useRef(true);
    const isCanvasVisible = useRef(false);
    const isHistoVisible = useRef(false);
    const isDistVisible = useRef(false);

    const camsX = 17;
    const camsY = 17;
    const width = useRef(1.0);
    const height = useRef(1.0);
    // const cameraGap = 0.08;
    const cameraGap = 0.1;
    // let lightfield_cameraview = useRef(<PerspectiveCamera 
    //                                 position={[0, 0, 1.5]} 
    //                                 fov={45}
    //                                 makeDefault />)

    const vertexPointShader = PointShader.vertexShader
    const fragmentPointShader = PointShader.fragmentShader
    
    const button_settings_texture_icon = "assets/icons/icon_settings_grey.png";

    useEffect(() => {
        const loadVideo = async (data) => {
            const camsX = data.grid_width;
            const camsY = data.grid_height;
            const resX = data.img_width;
            const resY = data.img_height;
            // const resY = data.img_width;
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
            //const json_path = props.filePath.split(".")[0] + ".json";
            const json_path = props.filePath[0];
            console.log(json_path)

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

    // useEffect(() => {
    //     console.log(isCanvasVisible.current)
    //     if (isCanvasVisible.current) {
    //         const { mean, stdDev } = calculateMeanAndStdDev(pixelBuffer.current, false, 4);
    //         // set the histogram data for 2D and 3D rendering
    //         const histograms = calculateColorHistograms(pixelBuffer.current, false, 4);

    //         let colors_buf = new Float32Array(pixelBuffer.current)
    //         // Entfernen jedes vierten Wertes aus colors_buf und Teilen der verbleibenden Werte durch 255
    //         const filteredColorsBuf = colors_buf
    //             .filter((_, index) => (index + 1) % 4 !== 0)
    //             .map(value => value / 255);

    //         // setState(prevState => ({
    //         //     ...prevState,
    //         //     histogram3D: histograms[1],
    //         //     colordistribution: new BufferAttribute(new Float32Array(filteredColorsBuf), 3),
    //         //     info: {
    //         //         width: 0,
    //         //         height: 0,
    //         //         channels: 0
    //         //     }
    //         // }));

    //         // histogram3D.current = histograms[1]
    //         updateHistogram(histograms[0], mean, stdDev, props.view)
    //     }
    // }, [isCanvasVisible.current]);

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
        if (perspectiveView) {
            setCamera(<PerspectiveCamera position={[4, 4, 4]} makeDefault />)
        } else {
            setCamera(<OrthographicCamera position={[10, 10, 10]} zoom={40} makeDefault />);
        }
    }, [perspectiveView]);

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const [isWaiting, setIsWaiting] = useState(false);

    const handleCameraChange = () => {
        // setCameraMoved(true);

        if (controlsRef.current) {
            // controlsRef.current.update();
            // Trigger the color data update with a delay
            if (planeRef.current && !isWaiting) {
                setIsWaiting(true);
                setTimeout(() => {
                    console.log("Camera moved");
                    planeRef.current.captureShaderOutput();
                    setIsWaiting(false);
                }, 1000); // 5 Sekunden Verzögerung
            }
        }
    };

    const planeRef = useRef();


    const showSettings = () => {
        setIsFieldSettingVisible(!isFieldSettingVisible);
    };

    const handleFocusChange = (e) => {
        // focus is in the range of -0.01 to 0.01
        setFocus(e.target.value / 10000.0);
    }

    const handleApertureChange = (e) => {
        // aperture is in the range of 1.0 to 10.0
        setAperture(e.target.value / 10.0);
    }

    const handlePlaneChange = (e) => {
        setStInput(!stInput);
    }

    const extractVideo = (filename, resX, resY, camsX, camsY, setFieldTexture, renderBarID, setComplete) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

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
            console.log('Loaded field data');
        
            fieldTexture.needsUpdate = true;
            setFieldTexture(fieldTexture);
        };
      
        video.addEventListener('seeked', async function() {
            if (seekResolve) seekResolve();
        });
      
        video.addEventListener('loadeddata', async () => {
            await fetchFrames();
            console.log('loaded data');
        
            setComplete(Math.random());
            const renderbarprocessingid = renderBarID + "_processing"
            const renderbartextid = renderBarID + "_text"
            $(`#${renderbarprocessingid}`).css("width", "0%")
            // $(`#${renderbartextid}`).html("PFUI")
            $(`#${renderBarID}`).css("display", "none")
        });
      
        video.crossOrigin = 'anonymous';
        video.src = filename;
    }

    const handleColorDataReady = (pixelData) => {
        pixelBuffer.current = pixelData;
    };

    /**************************************************************************************************************
     * 
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
     * 
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
     * 
     **************************************************************************************************************/
    const showObjectInfo = (e) => {
        setIsFieldInfoVisible(!isFieldInfoVisible);
        // setInfo(imageRef.current.getState().info)
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
                {/* Button for showing the deafault view */}
                {/* <RendererButton onClick={switchDefault} src={"assets/icons/icon_x.png"}/> */}
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
                    onColorDataReady={handleColorDataReady}
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
            <div className="lfr_field_settings" style={{ display: isFieldSettingVisible ? 'none' : 'block' }}>
                <table style={{width:"100%"}}>
                    <tbody>
                        <tr>
                            <td className='lfr_field_settings_table_cell'>Focus</td>
                            <td className='lfr_field_settings_table_cell'>
                                <input 
                                    type="range" 
                                    min="-100" 
                                    max="100" 
                                    defaultValue="0" 
                                    onChange={handleFocusChange} 
                                    style={{width: "100%"}}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className='lfr_field_settings_table_cell'>Aperture</td>
                            <td className='lfr_field_settings_table_cell'>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    defaultValue="50" 
                                    onChange={handleApertureChange} 
                                    style={{width: "100%"}}/>
                            </td>
                        </tr>
                        <tr>
                            <td className='lfr_field_settings_table_cell'>Show ST Plane</td>
                            <td className='lfr_field_settings_table_cell'>
                                <input 
                                    type="checkbox"
                                    defaultChecked={false}
                                    onChange={handlePlaneChange} 
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
};

export default LightFieldRenderer;