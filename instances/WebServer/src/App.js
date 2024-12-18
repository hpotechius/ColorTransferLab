/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, {useRef, useState, useEffect} from 'react';
import { createBrowserHistory } from 'history';
import Main from './pages/Main/Main'
import io from "socket.io-client";
import './settings/Global.scss';
import {WebRTCConnection, setWebRTCConnection} from './Utils/System';



/******************************************************************************************************************
 ******************************************************************************************************************
 ** Entry point of the application.
 ******************************************************************************************************************
 ******************************************************************************************************************/
function App() {

    // const webrtc = useRef(null);
 
    useEffect(() => {
        // if (webrtc.current === null)
        //     webrtc.current = new WebRTC(SIGNAL_SERVER);
        // if (WebRTCConnection === null)
        //     setWebRTCConnection();
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        // <div>

        //     <button onClick={() => {
        //         WebRTCConnection.sendServerMessage("/database")
        //     }}
        //     >Send Message</button>
        // </div>

        <Router>
            <Routes>
                <Route path="/ColorTransferLab" exact element={<Main/>} />
            </Routes>
        </Router>
    //     <React.StrictMode>
    //     <Router>
    //         <Routes>
    //             <Route path="/ColorTransferLab" exact element={<Main />} />
    //         </Routes>
    //     </Router>
    // </React.StrictMode>
    );
}

export default App;

export const history = createBrowserHistory({
    basename: process.env.PUBLIC_URL
});