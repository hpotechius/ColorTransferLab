/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


class PointShader {
    static vertexShader = 
        `
        uniform float pointsize;
        uniform bool enableColorDistribution;

        varying vec3 vColor;
        varying vec3 vNormal;
        attribute vec3 color;

        void main() {
            vColor = color;
            vNormal = normal;

            vec3 pos;

            if(!enableColorDistribution) {
                pos = vec3(position.xyz);
            }
            else {
                pos = vec3(color.rgb) * 4.0;
            }

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
            gl_PointSize = pointsize;
        }
        `

    static fragmentShader =
        `
        uniform bool enableNormalColor;

        varying vec3 vColor;
        varying vec3 vNormal;

        void main() {
            if(enableNormalColor) {
                gl_FragColor = vec4(abs(normalize(vNormal.xyz)), 1.0);
            }
            else {
                // LinearTosRGB encoding
                gl_FragColor = vec4( mix( pow( vColor.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), vColor.rgb * 12.92, vec3( lessThanEqual( vColor.rgb, vec3( 0.0031308 ) ) ) ), 1.0 );
            }
        }     
        `

}

export default PointShader
