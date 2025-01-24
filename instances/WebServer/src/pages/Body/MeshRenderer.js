/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect, useState, useRef} from 'react';
import {OrbitControls, PerspectiveCamera, OrthographicCamera} from "@react-three/drei";

import CustomCanvas from 'rendering/CustomCanvas';
import Axes from "rendering/Axes"
import './MeshRenderer.scss';
import {active_server} from 'Utils/System'
import TriangleMesh from "rendering/TriangleMesh"
import PointCloud from "rendering/PointCloud"
import VolumetricVideo from 'rendering/VolumetricVideo';
import RendererButton from './RendererButton';
import SettingsField from './SettingsField';
import SettingsFieldItem from './SettingsFieldItem';
import InfoField from './InfoField';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** MeshRenderer for rendering a mesh, point cloud or volumetric video.
 ******************************************************************************************************************
 ******************************************************************************************************************/
const MeshRenderer = (props) => {    
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const { id, filePath, setComplete, renderBarID, view, obj_type } = props;

    const [grid, changeGrid] = useState(<gridHelper args={[20,20, 0x222222, 0x222222]}/>)
    const [axis, changeAxis] = useState(<Axes />)
    const [camera, setCamera] = useState(null);
    const [perspectiveView, setPerspectiveView] = useState(true)
    const [isFieldSettingVisible, setIsFieldSettingVisible] = useState(false);
    const [isFieldInfoVisible, setIsFieldInfoVisible] = useState(false);
    const [isTextureMapVisible, setIsTextureMapVisible] = useState(false);
    const [fps, setFps] = useState(1);
    const [info, setInfo] = useState({});

    // If the volumetric video ist stopped the fps has to be set to 60 in order use the forward and backward function
    // properly. The original fps value is saved in savedFps.
    const savedFps = useRef(1);
    const voluPlay = useRef(true);
    const voluForward = useRef(false);
    const voluBackward = useRef(false);
    const pointCloudRef = useRef();
    const meshRef = useRef();
    const currentIndex = useRef(0);
    const activeObject = useRef([]);
    const activeObjectRefs = useRef([]);
    const activeTextureMap = useRef([]);

    const button_settings_texture_icon = "assets/icons/icon_settings_grey.png";
    const button_texturemap_texture_icon = "assets/icons/icon_texturemap_grey.png";
    const button_settings_dist_icon = "assets/icons/icon_dist_grey.png";
    const button_settings_histo_icon = "assets/icons/icon_histogram_grey.png";
    const button_settings_info_icon = "assets/icons/icon_information.png";

    const textureMapID = "texture_map" + props.id;
    const RID = props.view

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        console.debug("%c[INFO] Update MeshRenderer", "color: orange;")
        setIsFieldInfoVisible(false)
        setIsFieldSettingVisible(false)
        if(obj_type === "Mesh") {
            const obj = <TriangleMesh 
                            key={Math.random()} 
                            file_name={filePath} 
                            ref={meshRef}
                            view={RID}
                            type="Mesh"
                            renderBar={props.renderBarID} 
                            setGLOComplete={props.setComplete}
                        />

            const texture_path = filePath[0]

            activeObject.current.length = 0;
            activeObject.current.push(obj)

            activeTextureMap.current.length = 0;
            activeTextureMap.current.push(texture_path)

            activeObjectRefs.current.length = 0;
            activeObjectRefs.current.push(meshRef)

            props.setComplete(Math.random())
        }
        else if(obj_type === "PointCloud") {
            let obj = <PointCloud
                            key={Math.random()} 
                            file_path={filePath} 
                            view={RID}
                            ref={pointCloudRef}
                            type="PointCloud"
                            renderBar={props.renderBarID} 
                            setGLOComplete={props.setComplete}
                        />

            activeObject.current.length = 0;
            activeObject.current.push(obj)

            activeObjectRefs.current.length = 0;
            activeObjectRefs.current.push(pointCloudRef)

            props.setComplete(Math.random())
        }
        else if(obj_type === "VolumetricVideo") {
            const json_path = filePath + ".json";
            activeObject.current.length = 0;
            activeTextureMap.current.length = 0;
            activeObjectRefs.current.length = 0;

            const volumetricVideo = new VolumetricVideo();
            const loadVideo = async () => {
                const voluReturn = await volumetricVideo.createVolumetricVideo(filePath, props.setComplete, RID);
                activeObject.current.push(...voluReturn[0]);
                activeTextureMap.current.push(...voluReturn[1]);
                activeObjectRefs.current.push(...voluReturn[2]);
                console.log(activeObject.current);
            };
            loadVideo();
        }
        else {
            console.debug("%c[INFO] Empty MeshRenderer activeObject", "color: orange;")
            activeObject.current.length = 0;
            activeObjectRefs.current.length = 0;
            props.setComplete(Math.random())
        }
    }, [filePath, obj_type, renderBarID, setComplete ]);

    /**************************************************************************************************************
     * Changes the camera view from perspective to orthographic and vice versa.
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
     * Changes the grid visibility.
     **************************************************************************************************************/
    const handleGridChange = (e) => {
        if (e.target.checked) {
            changeGrid(<gridHelper args={[20, 20, 0x222222, 0x222222]} />);
        } else {
            changeGrid(null);
        }
    };

    /**************************************************************************************************************
     * Changes the axis visibility.
     **************************************************************************************************************/
    const handleAxisChange = (e) => {
        if (e.target.checked) {
            changeAxis(<Axes />);
        } else {
            changeAxis(null);
        }
    };

    /**************************************************************************************************************
     * Changes the point size of point cloud and the color distributions.
     **************************************************************************************************************/
    const handlePointSizeChange = (e) => {
        if (obj_type === "Mesh") {
            if (meshRef.current)
                meshRef.current.updateState({
                    pointsize: e.target.value,
                })
        } else if (obj_type === "PointCloud") {
            if (pointCloudRef.current)
                pointCloudRef.current.updateState({
                    pointsize: e.target.value,
                })
        }
    }

    /**************************************************************************************************************
     * Switches between orthographic and perspective view.
     **************************************************************************************************************/
    const handleOrthographicViewChange = (e) => {
        setPerspectiveView(!e.target.checked)
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const handleFpsChange = (event) => {
        setFps(event.target.value);
    };

    /**************************************************************************************************************
     * Renders the normals of the faces of the mesh or the normals of the vertices of the point cloud.
     **************************************************************************************************************/
    const handleVertexNormalViewChange = (e) => {
        console.log("handleVertexNormalViewChange")
        console.log(e.target.checked)
        if (pointCloudRef.current)
            pointCloudRef.current.updateState({
                colornormal: e.target.checked,
            })
    }

    /**************************************************************************************************************
     * Show the settings for the mesh / pointcloud / volumetric video view.
     * (1) Show Grid
     * (2) Show Axes
     * (3) Orthographic View
     * (4) Point Size
     * (5) WireFrame (mesh / volumetric video only)
     * (6) Vertex Normal View
     * (7) FPS (volumetric video only)
     **************************************************************************************************************/
    const showSettings = () => {
        setIsFieldSettingVisible(!isFieldSettingVisible);

        if(!isFieldSettingVisible)
            setIsFieldInfoVisible(false)
    };

    /**************************************************************************************************************
     * Show the texture map of the mesh.
     **************************************************************************************************************/
    const showTextureMap = () => {
        console.log("showTextureMap")
        setIsTextureMapVisible(!isTextureMapVisible);
    }

    /**************************************************************************************************************
     * Switches between the color distribution view and the mesh view.
     **************************************************************************************************************/
    const switchColorDistribution = () => {
        if (obj_type === "Mesh") {
            if (meshRef.current)
                meshRef.current.updateState({
                    colordistribution:  !meshRef.current.getState().colordistribution,
                    colorhistogram: false
                })
        } else if (obj_type === "PointCloud") {
            if (pointCloudRef.current)
                pointCloudRef.current.updateState({
                    colordistribution:  !pointCloudRef.current.getState().colordistribution,
                    colorhistogram: false
                })
        } else if (obj_type === "VolumetricVideo") {
            if (activeObjectRefs.current){
                activeObjectRefs.current.forEach(ref => {
                    if (ref.current) {
                        ref.current.updateState({
                            colordistribution: !ref.current.getState().colordistribution,
                            colorhistogram: false
                        });
                    }
                });
            }
        }
    }

    /**************************************************************************************************************
     * Switches between the 3D color histogram view and the mesh view.
     **************************************************************************************************************/
    const switchColorHistogram = () => {
        if (obj_type === "Mesh") {
            if (meshRef.current)
                meshRef.current.updateState({
                    colorhistogram:  !meshRef.current.getState().colorhistogram,
                    colordistribution: false
                })
        } else if (obj_type === "PointCloud") {
            if (pointCloudRef.current)
                pointCloudRef.current.updateState({
                    colorhistogram:  !pointCloudRef.current.getState().colorhistogram,
                    colordistribution: false
                })
        } else if (obj_type === "VolumetricVideo") {
            if (activeObjectRefs.current){
                activeObjectRefs.current.forEach(ref => {
                    if (ref.current) {
                        ref.current.updateState({
                            colorhistogram: !ref.current.getState().colorhistogram,
                            colordistribution: false
                        });
                    }
                });
            }
        }
    }

    /**************************************************************************************************************
     * Show wireframe of the mesh.
     **************************************************************************************************************/
    const handleWireFrameChange = (e) => {
        console.log(e.target.checked)
        if (obj_type === "Mesh") {
            if (meshRef.current)
                meshRef.current.updateState({
                    wireframe:  e.target.checked,
                })
        } else if (obj_type === "VolumetricVideo") {
            if (activeObjectRefs.current){
                activeObjectRefs.current.forEach(ref => {
                    if (ref.current) {
                        ref.current.updateState({
                            wireframe: e.target.checked
                        });
                    }
                });
            }
        }
    }
    
    /**************************************************************************************************************
     * Show face normals of the mesh.
     **************************************************************************************************************/
    const handleFaceNormal = (e) => {
        console.log(e.target.checked)
        if (meshRef.current)
            meshRef.current.updateState({
                faceNormal:  e.target.checked,
            })
    }

    /**************************************************************************************************************
     * Show Object information of the mesh.
     * (1) Number of vertices
     * (2) Number of faces
     * or the point cloud view.
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
     * Plays / Stops the volumetric video.
     **************************************************************************************************************/
    const playStopVolumetricVideo = () => {
        console.debug("%c[INFO] Play/Stop volumetric video", "color: orange;")
        if(!voluPlay.current) {
            setFps(savedFps.current)
        } else {
            savedFps.current = fps;
            setFps(60)
        }
        voluPlay.current = !voluPlay.current;
        console.log(voluPlay.current)
    }

    /**************************************************************************************************************
     * Moves to the next frame of the volumetric video.
     **************************************************************************************************************/
    const forwardVolumetricVideo = () => {
        console.debug("%c[INFO] Load next frame of volumetric video", "color: orange;")
        voluForward.current = true;
    }

    /**************************************************************************************************************
     * Moves to the previous frame of the volumetric video.
     **************************************************************************************************************/
    const backwardVolumetricVideo = () => {
        console.debug("%c[INFO] Load previous frame of volumetric video", "color: orange;")
        voluBackward.current = true;
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className="renderer_mesh">
            {/* Header of the renderer containing buttons for changing the output of the render view*/}
            <div className="rendererbutton-container">
                {/* Button for showing the mesh's texture map */}
                {(props.obj_type === "VolumetricVideo" || props.obj_type === "Mesh") && (
                    <>
                        <RendererButton onClick={showTextureMap} src={button_texturemap_texture_icon}/>
                    </>
                )}
                {(props.obj_type === "VolumetricVideo") && (
                    <>
                        <RendererButton onClick={backwardVolumetricVideo} src={"assets/icons/icon_backward.png"}/>
                        <RendererButton onClick={playStopVolumetricVideo} src={"assets/icons/play.png"}/>
                        <RendererButton onClick={forwardVolumetricVideo} src={"assets/icons/icon_forward.png"}/>
                    </>
                )}
                {/* Button for showing object information */}
                <RendererButton onClick={showInfo} src={button_settings_info_icon}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorHistogram} src={button_settings_histo_icon}/>
                {/* Button for switching between mesh view and the color dostribution view */}
                <RendererButton onClick={switchColorDistribution} src={button_settings_dist_icon}/>
                {/* Button for showing the settings for the mesh view */}
                <RendererButton onClick={showSettings} src={button_settings_texture_icon}/>
            </div>

            {/* Framenumber counter */}
            {props.obj_type === "VolumetricVideo" && (
                <div id="voluCounterID" className="voluCounter">Frame: 0</div>
            )}

            {/* Canvas for rendering the mesh / pointcloud / volumetric video */}
            <CustomCanvas 
                view={props.view} 
                rendering={activeObject.current} 
                refs={activeObjectRefs.current}
                style={{ display: isTextureMapVisible ? 'none' : 'block' }}
                textureMapID={textureMapID}
                activeTextureMap={activeTextureMap.current}
                currentIndex={currentIndex}
                fps={fps}
                playing={voluPlay}
                forward={voluForward}
                backward={voluBackward}
                setInfo={setInfo}
            >
                <ambientLight/>
                <OrbitControls/>
                {camera}
                {grid}
                {axis}
            </CustomCanvas>

            {/* Shows the texture map of the current mesh. */}
            <img 
                id={textureMapID} 
                style={{ display: isTextureMapVisible ? 'block' : 'none' }} 
                className='field_texture'
                alt='Texture Map'
                src={""}
                data-src={""}
            />

            {/* Settings for the mesh view */}
            <SettingsField visibility={isFieldSettingVisible}>
                <SettingsFieldItem type={"checkbox"} default={true} onChange={handleGridChange}>Show Grid</SettingsFieldItem>
                <SettingsFieldItem type={"checkbox"} default={true} onChange={handleAxisChange}>Show Axes</SettingsFieldItem>
                <SettingsFieldItem type={"checkbox"}  default={false} onChange={handleOrthographicViewChange}>Orthographic View</SettingsFieldItem>
                <SettingsFieldItem type={"range"} min="1" max="10" default={1} onChange={handlePointSizeChange}>Point Size</SettingsFieldItem>
                {/*Point Cloud specific settings */}
                {props.obj_type === "PointCloud" && (
                    <>
                        <SettingsFieldItem type={"checkbox"}  default={false} onChange={handleVertexNormalViewChange}>Vertex Normal View</SettingsFieldItem>
                    </>
                )}
                {/*Mesh and Volumetric Video specific settings */}
                {(props.obj_type === "VolumetricVideo" || props.obj_type === "Mesh") && (
                    <>
                        <SettingsFieldItem type={"checkbox"}  default={false} onChange={handleWireFrameChange}>WireFrame</SettingsFieldItem>
                    </>
                )}
                {/*Volumetric Video specific settings */}
                {props.obj_type === "VolumetricVideo" && (
                    <>
                        <SettingsFieldItem type={"range"} min="1" max="10" value={fps} onChange={handleFpsChange}>FPS</SettingsFieldItem>
                    </>
                )}
                {/*Mesh specific settings */}
                {props.obj_type === "Mesh" && (
                    <>
                        <SettingsFieldItem type={"checkbox"}  default={false} onChange={handleFaceNormal}>Face Normal</SettingsFieldItem>
                    </>
                )}
            </SettingsField>

            {/* Information field of the current object. Show for point clouds the number of vertices, etc. */}
            <InfoField visibility={isFieldInfoVisible}>
                {info}
            </InfoField>
        </div>
    )
};

export default MeshRenderer;