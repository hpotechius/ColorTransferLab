
/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import Layout from "@/components/layout/Layout";
import { Routes, Route } from 'react-router-dom';
import { WebRTCProvider } from '@/Utils/WebRTCProvider';
import UserStudy from "@/componentseval/layout/LayoutEval";
import LandingPage from "@/components/LandingPage";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** The new console.debug has the following structure:
 ** console.debug(messageType, messageString, object)
 ** IMPORTANT: App.jsx has to be added to the Ingore List within the Browser in order to print the correct 
 ** file where the new console.debug is called
 ******************************************************************************************************************
 ******************************************************************************************************************/
const overrideDebug = () => {
    const originalConsoleDebug = console.debug.bind(console);

    const messageTypeDict = {
        "INFO" : "orange",
        "SEND" : "lightgreen",
        "RECV" : "turquoise",
        "WARN" : "yellow",
        "ERRO" : "red",
    }

    console.debug = function(messageType, ...optionalParams) {
        if ((messageType === "INFO" || messageType === "SEND" || messageType === "RECV" || messageType === "WARN" || messageType === "ERRO" ) && optionalParams.length > 0) {

            originalConsoleDebug(
                `%c [${messageType}] ${optionalParams[0]}`, 
                `color: ${messageTypeDict[messageType]};`,
                ...optionalParams.slice(1)
            );

            const formattedMessage = (() => {
                if (optionalParams[1] !== undefined && typeof optionalParams[1] === "object") {
                    const json = JSON.stringify(optionalParams[1], null, 2).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    const id = "dict-" + Math.random().toString(36).substr(2, 9);
                    return `
                        ${messageType}: ${optionalParams[0]}
                        <span class="data2">
                            <details style="margin-left:11.7em;">
                                <summary>Details</summary>
                                <pre style="white-space:pre-wrap;">${json}</pre>
                            </details>
                        </span>
                    `;
                } else if (optionalParams[1] !== undefined) {
                    return ` ${messageType}: ${optionalParams[0]} <span class="data2">${optionalParams[1]}</span>`;
                } else {
                    return ` ${messageType}: ${optionalParams[0]}`;
                }
            })();

            // Prints the message to the app terminal
            window.pushTerminal?.(formattedMessage);
        } else {
            // Call the original console.debug for other messages
            originalConsoleDebug.call(console, messageType, ...optionalParams);
        }
    };
}

overrideDebug()

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function App() {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <WebRTCProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/ColorTransferLab/LandingPage" element={<LandingPage />} />
                <Route path="/ColorTransferLab/*" element={<Layout />} />
                <Route path="/ColorTransferLab/colortransfereval/*" element={<UserStudy />} />
                <Route path="/colortransfereval/*" element={<UserStudy />} />
                <Route path="/*" element={<Layout />} />
            </Routes>
        </WebRTCProvider>
    );
}