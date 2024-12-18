import React, {Suspense, useMemo, useRef, useEffect, useState, useCallback} from 'react';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { useLoader, useFrame } from "@react-three/fiber";
import SystemConfiguration from 'settings/SystemConfiguration';
import * as THREE from "three";

import PointShader from "shader/PointShader"
import PointCloud from './PointCloud';
import TriangleMesh from './TriangleMesh';

const vertexShader = PointShader.vertexShader
const fragmentShader = PointShader.fragmentShader


function Mesh (props){
    var isPointCloud = props.file_name.split("_").at(-1) == "pc"

    return (
        <>
            {isPointCloud ? (
                <PointCloud file_name={props.file_name}/>
            ) : (
                <TriangleMesh file_name={props.file_name}/>
            )}
        </>
    );




    
}

export default Mesh;