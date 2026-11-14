/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./IntroModification.scss"
import { useRef, useState, useEffect } from "react";
import { useWebRTC } from '@/Utils/WebRTCProvider.jsx';
import UpdateIcon from '@mui/icons-material/Update';
import { useSelectionUserStudy } from "@/contexts/SelectionContextUserStudy.jsx";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Area where the introduction text for the user study can be edited.
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function IntroModification({ activeTab }) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /*------------------------------------------------------------------------------------------------------------
    -- STATE VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const [introductionText, setIntroductionText] = useState("");

    /*------------------------------------------------------------------------------------------------------------
    -- REFERENCED VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const divRef = useRef();

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const { selectedTestType } = useSelectionUserStudy();
    const {rtc, dataChannelOpen} = useWebRTC();

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * Set up WebRTC handler for receiving introduction data.
     **************************************************************************************************************/
    useEffect(() => {
        rtc.onGetIntroductionsRequest = (data) => {
            console.debug("RECV", `[Compute Node] Introduction data received for test type ${selectedTestType}: `, data);
            setIntroductionText(data[0]?.text);
        };
    }, [rtc, selectedTestType]);

    /**************************************************************************************************************
     * Sends a request to the compute node for introduction data.
     **************************************************************************************************************/
    useEffect(() => {
        if (!dataChannelOpen) return;

        const test_type = selectedTestType || "rating";

        const data_send = {
            command: "/getIntroductionsRequest",
            data: { test_type: test_type }
        };

        console.debug("SEND", "[COMPUTE NODE] Request to apply User Study introductions via command /getIntroductionsRequest", data_send);
        rtc.sendMessage(JSON.stringify(data_send));
    }, [dataChannelOpen, rtc, selectedTestType]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Handles the update of the introduction text. Sends the updated text to the compute node.
     **************************************************************************************************************/
    const handleUpdateIntroduction = () => {
        const newText = divRef.current.innerHTML;
        setIntroductionText(newText);

        let data_send = {
            command: "/putIntroductionsRequest",
            data: {text: newText, test_type: selectedTestType || "rating"}
        };
        
        console.debug("SEND", "[COMPUTE NODE] Request to apply User Study introduction via command /putIntroductionsRequest", data_send);
        rtc.sendMessage(JSON.stringify(data_send));
    }

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div className="intromodification" style={{display: activeTab === "introduction" ? "block" : "none"}}>
            <div
                ref={divRef}
                className="intromodification-textarea"
                contentEditable={true}
                dangerouslySetInnerHTML={{ __html: introductionText }}
            />
            <UpdateIcon 
                className="intromodification-change-button" 
                titleAccess="Update Introduction"
                onClick={() => {handleUpdateIntroduction()}}
            />
        </div>
    );
}   