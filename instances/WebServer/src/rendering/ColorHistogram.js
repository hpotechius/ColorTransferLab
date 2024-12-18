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
import { isPowerOfTwo } from 'three/src/math/MathUtils';

/*************************************************************************************************************
* - creates three colored axes for visualizing the coordinatesystem's axes
* - the axes are shifted a little in y direction to prevent overlapping with the grid
* - props.histogram needs to have the following structure:
* TODO
*************************************************************************************************************/

function ColorHistogram(props) {
    const mesh = useRef();
    const hist = props.histogram

    // get max value
    var maxV = 0
    hist.forEach(element => {if(element[3] > maxV) {maxV = element[3]}});

    const spheres = []
    hist.forEach(element => {
        var radius = element[3] / maxV * 0.4
        var offset = 0.2
        // spheres which have a smaller radius than minRadius will be rendered with radius
        // minRadius independant of the actual amount of color points
        var minRadius = 0.02
        if(radius < minRadius && radius != 0)
            radius = minRadius
        if(radius != 0) {
            var r = element[0] 
            var g = element[1] 
            var b = element[2] 
            

            // spheres.push(<mesh key={Math.random()} position={[r/2.5+offset,g/2.5+offset,b/2.5+offset]}>
            spheres.push(<mesh key={Math.random()} position={[r/2.5+offset,g/2.5+offset,b/2.5+offset]}>
                                <sphereGeometry  args={[radius, 16, 16]}/>
                                {/* <sphereGeometry  args={[0.1, 16, 16]}/> */}
                                <meshBasicMaterial color={[r/10,g/10,b/10]} />
                        </mesh>)
        }

    });

    return (
       <mesh ref={mesh}>
          {spheres}
       </mesh>
    );
}

export default ColorHistogram;
