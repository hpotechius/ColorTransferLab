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
//const SIGNAL_SERVER = "http://localhost:8071"; // URL des Signalservers
const SIGNAL_SERVER = "https://signal.potechius.com"; // URL des Signalservers


let WebRTCConnection = null;

const setWebRTCConnection = () => {
    WebRTCConnection = new WebRTC(SIGNAL_SERVER);
};

export { WebRTCConnection, setWebRTCConnection };

export const execution_data = {
    "source": "",
    "reference": "",
    "output": "",
    "approach": "",
    "options": ""
}

export let evaluation_results = {}
export let available_metrics = []

export let available_methods = {}
