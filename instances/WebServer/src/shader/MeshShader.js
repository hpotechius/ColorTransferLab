/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


class MeshShader {
    static vertexShader = 
        `
        varying vec3 vColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform sampler2D uTexture;
        uniform bool enableColorDistribution;

        void main() {
            vColor = position;
            vNormal = normalize(normalMatrix * normal);
            vUv = uv; // Forwarding the texture coordinates
            //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vec3 pos;
            if(!enableColorDistribution) {
                pos = position;
            }
            else {
                // Sample the texture color at the UV coordinate
                vec4 texColor = texture2D(uTexture, vUv);
                // Use the texture color as the new position
                pos = texColor.rgb  * 4.0;
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
        `
    
    static fragmentShader =
        `
        uniform sampler2D uTexture; // Adding a texture uniform
        uniform bool faceNormal;
        varying vec3 vColor;
        varying vec2 vUv; // Receiving the texture coordinates
        varying vec3 vNormal;

        void main() {
            vec4 texColor = texture(uTexture, vUv);
            vec3 color;
            if(faceNormal) {
                color = (vNormal + 1.0) * 0.5;
            }
            else {
                color = mix(pow(texColor.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), texColor.rgb * 12.92, vec3(lessThanEqual(texColor.rgb, vec3(0.0031308))));
            }
            gl_FragColor = vec4(color.rgb, 1.0);
       
        }
        `
}

export default MeshShader