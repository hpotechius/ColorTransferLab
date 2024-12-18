/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


class ColorDistributionShader {
    static vertexShader = 
        `
        uniform float pointsize;
        varying vec3 vColor;
        attribute vec3 color;

        void main() {
            vColor = color;
            vec3 pos = vec3(position.xyz);
            pos = vec3(pos.rgb) * 4.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
            gl_PointSize = pointsize;
        }
        `

    static fragmentShader =
        `
        varying vec3 vColor;
        varying vec3 vNormal;

        void main() {
            // LinearTosRGB encoding
            gl_FragColor = vec4( mix( pow( vColor.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), vColor.rgb * 12.92, vec3( lessThanEqual( vColor.rgb, vec3( 0.0031308 ) ) ) ), 1.0 );

        }     
        `
}

export default ColorDistributionShader
