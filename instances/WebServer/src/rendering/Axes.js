/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


import * as THREE from 'three'


/******************************************************************************************************************
 ******************************************************************************************************************
 ** - creates three colored axes for visualizing the coordinatesystem's axes
 ** - the axes are shifted a little in y direction to prevent overlapping with the grid
 ******************************************************************************************************************
 ******************************************************************************************************************/
const Axes = () => {
    const pointsRed = []
    pointsRed.push(new THREE.Vector3(0, 0.001, 0))
    pointsRed.push(new THREE.Vector3(4, 0.001, 0))
    const lineGeometryRed = new THREE.BufferGeometry().setFromPoints(pointsRed)

    const pointsGreen = []
    pointsGreen.push(new THREE.Vector3(0, 0.001, 0))
    pointsGreen.push(new THREE.Vector3(0, 4.001, 0))
    const lineGeometryGreen = new THREE.BufferGeometry().setFromPoints(pointsGreen)

    const pointsBlue = []
    pointsBlue.push(new THREE.Vector3(0, 0.001, 0))
    pointsBlue.push(new THREE.Vector3(0, 0.001, 4))
    const lineGeometryBlue = new THREE.BufferGeometry().setFromPoints(pointsBlue)
  
    return (
        <>
            <line geometry={lineGeometryGreen}>
                <lineBasicMaterial attach="material" color={'#00FF00'} linewidth={1} linecap={'round'} linejoin={'round'} />
            </line>
            <line geometry={lineGeometryRed}>
                <lineBasicMaterial attach="material" color={'#FF0000'} linewidth={1} linecap={'round'} linejoin={'round'} />
            </line>
            <line geometry={lineGeometryBlue}>
                <lineBasicMaterial attach="material" color={'#0000FF'} linewidth={1} linecap={'round'} linejoin={'round'} />
            </line>

        </>
    )
}

export default Axes;