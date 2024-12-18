/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {Suspense, useMemo, useRef, useEffect, useState} from 'react';
import { useLoader, useFrame } from "@react-three/fiber";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import * as THREE from 'three'
import PointShader from "shader/PointShader"

const vertexShader = PointShader.vertexShader
const fragmentShader = PointShader.fragmentShader


/*************************************************************************************************************
* - creates three colored axes for visualizing the coordinatesystem's axes
* - the axes are shifted a little in y direction to prevent overlapping with the grid
*************************************************************************************************************/
function VoxelGrid(props) {
    const mesh = useRef();
    const centers = props.voxelgrid_centers
    const colors = props.voxelgrid_colors
    const scale = props.voxelgrid_scale

    function linearToSrgb(val) {
        var out = []
        for(var i = 0; i < 3; i++){
            if(0.0 <= val[i] <= 0.0031308) {
                out.push(val[i] * 12.92)
            } else {
                out.push(Math.pow(val[i], 1.0/2.4) * 1.055 -0.055)
            }
        }
        return out
    }

    function srgbToLinear(val) {
        var out = []
        for(var i = 0; i < 3; i++){
            if(0.0 <= val[i] <= 0.04045) {
                out.push(val[i] / 12.92)
            } else {
                out.push(Math.pow((val[i] + 0.055) / 1.055, 2.4))
            }
        }
        return out
    }

    var cen = props.center.current//SysConf.data_config[props.id]["pc_center"]
    var scaling = props.scale.current//SysConf.data_config[props.id]["pc_scale"]
    
    const boxes = []
    centers.map(function(e, i) {
        boxes.push(<mesh key={Math.random()} position={e}>
                    <boxGeometry  args={[scale, scale, scale]}/>
                    <meshBasicMaterial color={srgbToLinear(colors[i])} />
                    </mesh>)
      });

    return (
       <mesh ref={mesh} position={[-cen.x*scaling, -cen.y*scaling + 1.0, -cen.z*scaling]} scale={scaling}>
          {boxes}
       </mesh>
    );
}

export default VoxelGrid;
