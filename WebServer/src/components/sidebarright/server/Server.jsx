/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./Server.scss";
import {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import PublicTwoToneIcon from '@mui/icons-material/PublicTwoTone';
import PublicOffTwoToneIcon from '@mui/icons-material/PublicOffTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import DnsIcon from '@mui/icons-material/Dns';
import {useWebRTC} from '@/Utils/WebRTCProvider';
import config from "@/config.json"
import {useSelection} from "@/contexts/SelectionContext";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Shows available Compute Nodes and allows to connect to them by creating a WebRTC offer. 
 ** Also allows to disconnect from the currently connected Compute Node.
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function Server({rightBottomHeight}) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /*------------------------------------------------------------------------------------------------------------
    -- STATE VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const [computeNodes, setComputeNodes] = useState({});
    const [connectedKey, setConnectedKey] = useState(null);
    const [relayConnectedKey, setRelayConnectedKey] = useState(null);
    const [password, setPassword] = useState(config.password);

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const {rtc} = useWebRTC();
    const { setContextConnectedNodes, selectedTurnServer } = useSelection();

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * Sets the received list of available Compute Nodes and listens for connection state changes to 
     * update the UI accordingly.
     **************************************************************************************************************/
    useEffect(() => {
        rtc.onDbRequest = (data) => {
            setComputeNodes(data);
        };

        rtc.onConnectionStateChange = ({ state, serverKey }) => {
            if (state === "connected") {
                setConnectedKey(serverKey);
            } else if (state === "disconnected" || state === "failed" || state === "closed") {
                setConnectedKey(null);
            }
        };
        rtc.onRelayStateChange = ({ active, serverKey }) => {
            setRelayConnectedKey(active ? serverKey : null);
        };
    }, [rtc]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Update password state.
     **************************************************************************************************************/
    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    /**************************************************************************************************************
     * Create offer for connecting to Compute Node.
     **************************************************************************************************************/
    function handleEntryClick(key, entry) {
        console.debug("INFO", `Attempting to connect to Compute Node: ${entry.name}`)
        setContextConnectedNodes(key)
        rtc.createOffer(key, password, null, selectedTurnServer);
    }

    /**************************************************************************************************************
     * Dicsonnects from Compute Node.
     **************************************************************************************************************/
    function handleDisconnect() {
        if (rtc && typeof rtc.disconnect === "function")
            rtc.disconnect();

        setConnectedKey(null);
        setRelayConnectedKey(null);
        localStorage.clear();
        window.location.reload();
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <Box className="server" sx={{ height: rightBottomHeight + "px" }}>
            <div className="server_title">
                <DnsIcon className="server-icon"/>
                SERVER
                <input
                    className="server-password-input"
                    type="password"
                    id="password"
                    placeholder="password"
                    onChange={handlePasswordChange}
                    value={password}
                />
            </div>
            <div className="server_content">
                {Object.entries(computeNodes).map(([key, entry]) => {
                    const isActive = key === connectedKey;
                    const isRelayActive = key === relayConnectedKey;
                    return (
                        <div key={key} style={{ display: "flex", alignItems: "center" }}>
                            <button
                                className="server_entry_button"
                                onClick={() => handleEntryClick(key, entry)}
                                style={
                                    isActive
                                        ? {
                                            border: "1px solid #4caf50",
                                            backgroundColor: "#1b1b1b"
                                        }
                                        : isRelayActive
                                        ? {
                                            border: "1px solid #2196f3",
                                            backgroundColor: "#1b1b1b"
                                        }
                                        : {}
                                }
                                disabled={isActive || isRelayActive}
                            >
                                {entry.privacy ? 
                                    <PublicOffTwoToneIcon className="server-button-icon"
                                        style={{color: isActive ? "#4caf50" : isRelayActive ? "#2196f3" : undefined}}
                                    /> 
                                    :
                                    <PublicTwoToneIcon className="server-button-icon"
                                        style={{color: isActive ? "#4caf50" : isRelayActive ? "#2196f3" : undefined}}
                                    /> 
                                }
                                {entry.name}
                            </button>
                            {(isActive || isRelayActive) && (
                                <button className='server_exit_button'
                                    title="Disconnect"
                                    onClick={handleDisconnect}
                                >
                                    <CloseIcon className="server-close-button" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </Box>
    );
}