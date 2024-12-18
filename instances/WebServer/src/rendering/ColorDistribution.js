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
function ColorDistribution(props) {
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


    var obj = useLoader(PLYLoader, props.file_path)
    let colors = new Float32Array(obj.attributes.color.array)

    if(props.from_image) {
        var canvas = document.createElement('canvas');
        // TODO: Number of vertices in 3D histogram has to be scaled properly 
        canvas.width = props.image.width / 2
        canvas.height = props.image.height / 2
        // {willReadFrequently:true} removes the warning "Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true."
        var context = canvas.getContext('2d', {willReadFrequently:true});
        context.drawImage(props.image, 0, 0);

        const vv = new Float32Array(canvas.width * canvas.height * 3);
        const nn = new Float32Array(canvas.width * canvas.height * 3);
        const cc = new Float32Array(canvas.width * canvas.height * 3);
        var count = 0
        for(var i = 0; i < canvas.height; i++) 
        {
            for(var j = 0; j < canvas.width; j++) 
            {
                var pxData = context.getImageData(j, i, 2, 2).data
                vv[count] = pxData[0] / 255.0
                vv[count+1] = pxData[1]/ 255.0
                vv[count+2] = pxData[2]/ 255.0

                nn[count] = 1.0
                nn[count+1] = 0.0
                nn[count+2] = 0.0

                cc[count] = pxData[0] / 255.0
                cc[count+1] = pxData[1]/ 255.0
                cc[count+2] = pxData[2]/ 255.0
                count += 3
            }
        }

        obj.setAttribute( 'color', new THREE.BufferAttribute( cc, 3 ) );
        colors = new Float32Array(obj.attributes.color.array)
    }

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

export default ColorDistribution;
