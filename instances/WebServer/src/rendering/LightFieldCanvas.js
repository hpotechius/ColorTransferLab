/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {Suspense, useState, useEffect, useRef} from 'react';
import {Canvas} from "@react-three/fiber";

function LightFieldCanvas(props) {    
    const [currentIndex, setCurrentIndex] = useState(0);
    //const meshLength = useRef( props.rendering.length)


    //meshLength.current = props.rendering.length

    useEffect(() => {
        if (Array.isArray(props.rendering)) {
            const interval = setInterval(() => {
                const nu = props.rendering.length
                // check if the rendering array is empty to prevent currentIndex to be nan
                if (nu === 0)
                    setCurrentIndex(0);
                else 
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % nu);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, []);

    return (
        <Canvas 
            id={props.id} 
            className={props.className}
            >
            {props.children}
            {/* <Suspense fallback={null}>
                {<group>{props.rendering[currentIndex]}</group>}
            </Suspense> */}
        </Canvas>
    )
}

export default LightFieldCanvas;