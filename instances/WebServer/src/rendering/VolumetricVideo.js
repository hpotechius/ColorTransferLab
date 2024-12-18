/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React from "react";
import {pathjoin} from 'Utils/Utils';
import TriangleMesh from "rendering/TriangleMesh"

class VolumetricVideo {
    async createVolumetricVideo(filepath, setComplete, view) {
        // const json_path = filepath + ".json";
        const json_path = filepath[0]
        // console.log(json_path)
        const activeObject = [];
        const activeTextureMap = [];
        const meshRefs = [];

        try {
            const response = await fetch(json_path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // filepath contains of the following information:
            // [0] = path to the json file
            // [1] = path to jpg file with index 0
            // [2] = path to mtl file with index 0
            // [3] = path to obj file with index 0
            // [4] = path to jpg file with index 1
            // ...
            for (let i = 0; i < data["num_frames"]; i++) {
                // let texture_path = pathjoin(filepath + "_" + paddedNumber + ".jpg");
                let texture_path = filepath[(i * 3) + 1];
                activeTextureMap.push(texture_path);

                const startIdx = (i * 3) + 1;
                const endIdx = startIdx+3;
                const subpath = filepath.slice(startIdx, endIdx);
                const meshRef = React.createRef();
                meshRefs.push(meshRef);
                const obj3D = (
                    <TriangleMesh 
                        key={Math.random()} 
                        file_name={subpath} 
                        ref={meshRef}
                        view={view}
                        type="VolumetricVideo"
                        setGLOComplete={setComplete}
                    />
                );
                activeObject.push(obj3D);
            }
        } catch (error) {
            console.error("Error loading JSON:", error);
        }

        return [activeObject, activeTextureMap, meshRefs];
    }
}

export default VolumetricVideo;