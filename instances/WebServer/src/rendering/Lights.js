/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {Suspense, useMemo, useRef, useEffect} from 'react';


const DirectionalLight = () => {
    const spotLight1 = useRef();
    return (
        <>
            <ambientLight intensity={0.2} />
            <directionalLight
                ref={spotLight1}
                position={[1, 1, 0]}
                color="#FFA274"
                intensity={0.9}
            />
        </>
    );
};   

export default DirectionalLight