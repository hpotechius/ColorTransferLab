/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./Header.scss";
import {useState, useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import GitHubIcon from '@mui/icons-material/GitHub';
import useMediaQuery from '@mui/material/useMediaQuery';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import Button from "@mui/material/Button";
import BackspaceIcon from '@mui/icons-material/Backspace';
import {useWebRTC} from '@/Utils/WebRTCProvider';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Header component containing the application title, buttons for opening the GitHub repository and the user 
 ** study view, as well as three buttons for changing the visibility of the left sidebar, the main view and the 
 ** right sidebar. Additionally, it shows the client name and ID in desktop mode.
 ******************************************************************************************************************
 ******************************************************************************************************************/
 export default function Header({showLeft, setShowLeft, showRight, setShowRight, showBottom, setShowBottom, setIsUserStudyOpen, isUserStudyOpen}) {
     const {rtc} = useWebRTC();
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /*------------------------------------------------------------------------------------------------------------
    -- STATE VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const [clientInfo, setClientInfo] = useState({ clientId: "", clientName: "" });

    /*------------------------------------------------------------------------------------------------------------
    -- REFERENCED VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const hasOpenedUserStudyRef = useRef(false);

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const isMobile = useMediaQuery("(max-width:900px)");
    let title = "ColorTransferLab" + (isUserStudyOpen ? " - User Study Admin Panel" : "");

    const viewButtons = [
        {
            className: "header-view-button header-view-button-left",
            onClick: () => setShowLeft(!showLeft),
            show: showLeft,
        },
        {
            className: "header-view-button header-view-button-bottom",
            onClick: () => setShowBottom(!showBottom),
            show: showBottom,
        },
        {
            className: "header-view-button header-view-button-right",
            onClick: () => setShowRight(!showRight),
            show: showRight,
        }
    ];

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * Request user study databases when the user study view is already open and the component is mounted for 
     * the first time. Additionally, set up an event listener for receiving client info from the WebRTC provider.
     **************************************************************************************************************/
     useEffect(() => {
        // 
        if (isUserStudyOpen && !hasOpenedUserStudyRef.current) {
            hasOpenedUserStudyRef.current = true;
        }

        if (window.webrtcClientInfo) {
            setClientInfo({
                clientId: window.webrtcClientInfo.clientId || "",
                clientName: window.webrtcClientInfo.clientName || "",
            });
        }

        const handler = (e) => {
            const { clientId, clientName } = e.detail || {};
            setClientInfo({
                clientId: clientId || "",
                clientName: clientName || "",
            });
        };
        window.addEventListener("webrtc:clientInfo", handler);
        return () => window.removeEventListener("webrtc:clientInfo", handler);
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Switch isUserStudyOpen state, which opens the User Study Admin Interface and changes the content of the console tabs.
     **************************************************************************************************************/
    const handleUserstudyClick = () => {
        setIsUserStudyOpen(!isUserStudyOpen)

        isUserStudyOpen ? 
            console.debug("INFO", "Close User Study Admin Interface.") :
            console.debug("INFO", "Open User Study Admin Interface.") ;

        if (!isUserStudyOpen && !hasOpenedUserStudyRef.current) {
            hasOpenedUserStudyRef.current = true;
        }
    };

    /**************************************************************************************************************
     * Opens the ColorTransferLab GitHub Page in a new tab.
     **************************************************************************************************************/
    const handleGithubClick = () => {
        window.open('https://github.com/hpotechius/ColorTransferLab', '_blank');
    };

    /**************************************************************************************************************
     * Resets the application state by removing all entries from localStorage and reloading the page.
     **************************************************************************************************************/
    const handleResetClick = () => {
        rtc.disconnect();
        localStorage.clear();
        window.setTimeout(() => window.location.reload(), 150);
    };

    /**************************************************************************************************************
     * Open Personal Website in a new tab.
     **************************************************************************************************************/
    const handlePersonalClick = () => {
        window.open('https://potechius.eu', '_blank');
    };

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <Box className="header">
            <img 
                className="header-logo" 
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="HMP Logo" 
                title="Personal Website of Herbert M. Potechius"
                onClick={handlePersonalClick}
            />

            <span className="header-title">{title}</span>

            {/* 
            Button container with buttons opening:
            1. Github Webpage
            2. User-Study-Framework
            */}
            <div className="header-button-list">
                <BackspaceIcon
                    className={`header-button`}
                    onClick={handleResetClick}
                    titleAccess="Reset Application"
                />
                <GitHubIcon
                    className={`header-button`}
                    onClick={handleGithubClick}
                    titleAccess="Open GitHub Repository"
                />
                <PersonSearchIcon
                    className={`header-button ${isUserStudyOpen ? "active" : ""}`}
                    onClick={handleUserstudyClick}
                    titleAccess="Open User Study View"
                />
            </div>

            {/* Three buttons for changing the visibility of the two side bars and the main view */}
            {!isMobile && (
                <>
                    {viewButtons.map((button, index) => (
                        <Button
                            key={index}
                            className={button.className}
                            size="small"
                            variant="outlined"
                            disableRipple
                            disableFocusRipple
                            onClick={button.onClick}
                            sx={{
                                "&::before": {
                                    backgroundColor: button.show ? "#000" : "#fff",
                                }
                            }}
                        />
                    ))}
                </>
            )}

            {/* Client-Info: only visible in desktop mode */}
            {!isMobile && clientInfo.clientName && clientInfo.clientId && (
                <div className="header-client-info">
                    {clientInfo.clientName} ({clientInfo.clientId})
                </div>
            )}
        </Box>
    );
}