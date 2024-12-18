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
import ColorDistributionShader from "shader/ColorDistributionShader"
const vertexShader = ColorDistributionShader.vertexShader
const fragmentShader = ColorDistributionShader.fragmentShader


/*************************************************************************************************************
* - creates three colored axes for visualizing the coordinatesystem's axes
* - the axes are shifted a little in y direction to prevent overlapping with the grid
*************************************************************************************************************/
function ColorDistribution2(props) {
    var setting_pointsize = document.getElementById('settings_pointsize')
    const [pointsize, changePointsize] = useState(setting_pointsize.value)
    const change_pointsize = (event) => {
        changePointsize(event.target.value)
    }

    useEffect(() => {
      var setting_pointsize = document.getElementById('settings_pointsize')
      setting_pointsize.addEventListener("change", change_pointsize);

      return () => {
            var setting_pointsize = document.getElementById('settings_pointsize')
            setting_pointsize.removeEventListener("change", change_pointsize);
        }
    }, []);


    let ref = useRef()
    useFrame(() => {
        ref.current.material.uniforms.pointsize = {value: pointsize}
    })


    let colors = new Float32Array(props.dist_vals)

    return(
        <points key={Math.random} ref={ref}>
             <bufferGeometry>
                 <bufferAttribute attachObject={["attributes", "position"]} count={colors.length / 3} array={colors} itemSize={3} />
                 <bufferAttribute attachObject={["attributes", "color"]} count={colors.length / 3} array={colors} itemSize={3} />
             </bufferGeometry>
             <shaderMaterial fragmentShader={fragmentShader} vertexShader={vertexShader} />
       </points>
    );
}

export default ColorDistribution2;
