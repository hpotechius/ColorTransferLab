/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import WebRTC from 'Utils/WebRTC';




export let active_server = "";
//export let RelayServer = "https://proxy.potechius.com";
export let RelayServer = "http://192.168.178.200:8002";
const SIGNAL_SERVER = "http://localhost:8080"; // URL des Signalservers
// const SIGNAL_SERVER = "https://potechius.com:9090"; // URL des Signalservers


let WebRTCConnection = null;

const setWebRTCConnection = () => {
    WebRTCConnection = new WebRTC(SIGNAL_SERVER);
};

export { WebRTCConnection, setWebRTCConnection };

// export const execution_params_options = []

// // these parameters will be sent to the python server
// export const execution_params_objects = {
//     "src": "",
//     "ref": "",
//     "out": ""
// }

// export const execution_approach = {
//     "method": "",
//     "options": ""
// }

export const execution_data = {
    "source": "",
    "reference": "",
    "output": "",
    "approach": "",
    "options": ""
}

export let evaluation_results = {}
export let available_metrics = []