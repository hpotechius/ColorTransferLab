/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

/*
Source: https://github.com/hypothete/lightfield-webgl2
*/


class LightFieldVertexShader {
    static vertexShader = 
        `
        uniform float aspect;

        out vec2 vSt;
        out vec2 vUv;

        void main() {
            vec3 posToCam = cameraPosition - position;
            vec3 nDir = normalize(posToCam);
            // given similar triangles we can project the focusing plane point
            float zRatio = posToCam.z / nDir.z;
            vec3 uvPoint = zRatio * nDir;

            // offset the uv into 0-1 coords
            uvPoint.xy = vec2(uvPoint.x, uvPoint.y / aspect) + 0.5;
            vUv = uvPoint.xy;
            vUv.y = vUv.y;
            vUv.x = 1.0 - vUv.x;

            vSt = uv;
            vSt.x = 1.0 - vSt.x;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `

    static fragmentShader =
        `
        precision highp float;
        precision highp int;
        precision highp sampler2DArray;

        uniform sampler2DArray field;
        uniform vec2 camArraySize;
        uniform float aperture;
        uniform float focus;
        uniform float aspect;

        in vec2 vSt;
        in vec2 vUv;

        void main() {
            vec4 color = vec4(0.0);
            float colorCount = 0.0; // proportional exposure

            if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) {
                discard;
            }

            for (float i = 0.0; i < camArraySize.x; i++) {
                for (float j = 0.0; j < camArraySize.y; j++) {
                    float dx = i - (vSt.x * camArraySize.x - 0.5);
                    float dy = j - (vSt.y  * camArraySize.y - 0.5);
                    float sqDist = dx * dx + dy * dy;
                    if (sqDist < aperture) {
                        float camOff = i + camArraySize.x * j;
                        vec2 focOff = vec2(dx, dy) * focus;
                        vec2 sampleUv = vUv + focOff;
                        color += texture(field, vec3(sampleUv, camOff));
                        colorCount++;
                    }
                }
            }

            gl_FragColor = vec4(color.rgb / colorCount, 1.0);
        }
        `
}

export default LightFieldVertexShader;