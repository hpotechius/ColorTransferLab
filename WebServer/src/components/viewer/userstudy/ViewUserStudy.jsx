/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./ViewUserStudy.scss";
import { useState, useEffect } from "react";
import ConsoleTabButton from "@/components/console/elements/ConsoleTabButton.jsx"
import { getInitialValue } from "@/Utils/Utils"
import Preview from "@/components/viewer/userstudy/Preview.jsx";
import Results from "@/components/viewer/userstudy/Results.jsx";
import IntroModification from "@/components/viewer/userstudy/IntroModification";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Main view of the user study admin panel where the user can switch between the preview, results and 
 ** introduction modification tab.
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function ViewUserStudy({ isUserStudyOpen }) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /*------------------------------------------------------------------------------------------------------------
    -- STATE VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const storedActiveTab = getInitialValue('ViewUserStudy:activeTab');
    const normalizedActiveTab = storedActiveTab?.toLowerCase() ?? "preview";
    const [activeTab, setActiveTab] = useState(normalizedActiveTab);

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const consoleTabs = [
        { label: 'Preview' },
        { label: 'Results' },
        { label: 'Introduction' }
    ];

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/
    
    /**************************************************************************************************************
     * Save active tab to local storage whenever it changes.
     **************************************************************************************************************/
    useEffect(() => {
        localStorage.setItem('ViewUserStudy:activeTab', JSON.stringify(activeTab));
    }, [activeTab]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div className="viewuserstudy" style={{display: !isUserStudyOpen ? "none" : ""}}>
            <div className="viewuserstudy-body">

                {/* Horizontal tab bar */}
                <div className="viewuserstudy-tabs">
                    {consoleTabs.map(tab => (
                        <ConsoleTabButton
                            key={tab.label}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isUserStudyOpen={isUserStudyOpen}
                        >
                            {tab.label}
                        </ConsoleTabButton>
                    ))}
                </div>

                {/* Content area */}
                <div className="viewuserstudy-content">
                    <Preview activeTab={activeTab}/>
                    <Results activeTab={activeTab}/>
                    <IntroModification activeTab={activeTab}/>
                </div>
            </div>
        </div>
    );
}