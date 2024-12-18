/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useState, useEffect} from 'react';
import $ from 'jquery';
import Header from './../Header/Header'
import Footer from './../Footer/Footer'
import SideBarLeft from '../SideBarLeft/SideBarLeft';
import SideBarRight from '../SideBarRight/SideBarRight';
import Console from '../Console/Console';
import Body from '../Body/Body';
import './Main.scss';
import {WebRTCConnection, setWebRTCConnection} from 'Utils/System';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Main() {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const [width, setWidth] = useState(window.innerWidth);
    const [darkmode, setDarkmode] = useState(true);
    const [mobileLandscape, setMobileLandscape] = useState(false);
    const [singleView, setSingleView] = useState(false)
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * (1) Set the WebRTC connection.
     * Resize the window and set the height of the app to the window height.
     * Check if the window is in landscape mode on mobile devices. Only portrait mode is supported.
     **************************************************************************************************************/
    useEffect(() => {
        if(WebRTCConnection === null) {
            console.debug("%c[INFO] Setup WebRTC connection", "color: orange");
            setWebRTCConnection();
            console.debug("%c[SEND] WebRTC Request to Server: Get List of Databases via /database", "color: lightgreen");
            WebRTCConnection.sendServerMessage("/database", null)
        }

        function resize() {
            setWidth(window.innerWidth)
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }

        $( window ).on( "resize", function(){resize(); checkWindowSize();});

        const checkWindowSize = () => {
            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
            const isLandscape = window.innerWidth > window.innerHeight;
            setMobileLandscape(isMobile && isLandscape);
        };
        checkWindowSize();
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const handleSendFeedback = () => {
        const feedbackArea1 = document.getElementById('feedback-area-1').value.trim();
        const feedbackArea2 = document.getElementById('feedback-area-2').value.trim();

        if (feedbackArea1 === '' || feedbackArea2 === '') {
            setErrorMessage('Both feedback fields are required.');
            return;
        }

        const feedback = {
            category: feedbackArea1,
            message: feedbackArea2
        };

        console.log(feedback);

        // server_post_feedback(RelayServer, "feedback", feedback)
        console.debug("%c[SEND] WebRTC Request to Server: Send feeback via command /feedback", "color: light green");
        WebRTCConnection.sendServerMessage("feedback", feedback)

        setErrorMessage('');
        setFeedbackSent(true);
        setTimeout(() => {
            setFeedbackSent(false);
            document.getElementById('feedback-container').style.display = 'none';
        }, 2000); // Overlay wird nach 2 Sekunden ausgeblendet
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    const closeFeedback = () => {
        $("#feedback-container").css("display", "none");
    };

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id="mainbody">
            <Header darkmode={darkmode} toggleDarkmode={setDarkmode}/>
            <Console/>
            <Body width={width} singleView={singleView}/>
            <SideBarLeft setSingleView={setSingleView}/>
            <SideBarRight/>
            {mobileLandscape ? <div id="landscapeOverlay">Landscape mode is not supported!</div> : <></>}
            <Footer/>

            <div id="feedback-container">
                <div id="feedback-opacity"/>
                <div id="feedback-block">
                {feedbackSent ? (
                    <div id="overlay">
                        <img id="img-success" src="assets/success.png" alt="Feedback sent" />
                        <div id="feedback-success">Feedback sent successfully!</div>
                    </div>
                ) : (
                    <>
                        <div id="feedback-close" onClick={closeFeedback}>X</div>
                        <div className='feedback-header'>Feedback Category</div>
                        <textarea id="feedback-area-1" rows="4" cols="50" placeholder=""></textarea>
                        <div className='feedback-header'>Message</div>
                        <textarea id="feedback-area-2" rows="4" cols="50" placeholder=""></textarea>
                        <button id="send-feedback-button" onClick={handleSendFeedback}>Send Feedback</button>
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                    </>
                )}

                </div>
            </div>
        </div>
    );
}

export default Main;
