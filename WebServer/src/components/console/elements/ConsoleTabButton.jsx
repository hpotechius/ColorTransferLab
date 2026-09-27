/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./ConsoleTabButton.scss"
import TerminalIcon from '@mui/icons-material/Terminal';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoIcon from "@mui/icons-material/Info";
import GroupIcon from '@mui/icons-material/Group';
import PreviewIcon from '@mui/icons-material/Preview';
import PixIcon from '@mui/icons-material/Pix';
import SettingsIcon from '@mui/icons-material/Settings';
import FlagCircleIcon from '@mui/icons-material/FlagCircle';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Single Console Tab Button for enabling the corresponding content area. 
 ******************************************************************************************************************
 ******************************************************************************************************************/
 export default function ConsoleTabButton({activeTab, setActiveTab, isUserStudyOpen, children}) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const consoleIcons = {
        // Execution Tabs
        "Terminal": {icon: <TerminalIcon className="consoletabbutton-icon console_icon" />, idx: "terminal", enabled: true},
        "Evaluation": {icon: <NoteAltIcon className="consoletabbutton-icon console_icon" />, idx: "evaluation", enabled: !isUserStudyOpen},
        "Configuration": {icon: <SettingsSuggestIcon className="consoletabbutton-icon console_icon" />, idx: "configuration", enabled: !isUserStudyOpen},
        "Data": {icon: <TableChartIcon className="consoletabbutton-icon console_icon" />, idx: "data", enabled: !isUserStudyOpen},
        "Information": {icon: <InfoIcon className="consoletabbutton-icon console_icon" />, idx: "information", enabled: !isUserStudyOpen},
        // User Study Tabs
        "Metrics": {icon: <NoteAltIcon className="consoletabbutton-icon console_icon" />, idx: "metrics", enabled: isUserStudyOpen},
        "Participants": {icon: <GroupIcon className="consoletabbutton-icon console_icon" />, idx: "participants", enabled: isUserStudyOpen},
        "Test Settings": {icon: <SettingsIcon className="consoletabbutton-icon console_icon" />, idx: "testsettings", enabled: isUserStudyOpen},

        "Preview": {icon: <PreviewIcon className="consoletabbutton-icon console_icon" />, idx: "preview", enabled: isUserStudyOpen},
        "Results": {icon: <PixIcon className="consoletabbutton-icon console_icon" />, idx: "results", enabled: isUserStudyOpen},
        "Introduction": {icon: <FlagCircleIcon className="consoletabbutton-icon console_icon" />, idx: "introduction", enabled: isUserStudyOpen}
    }

    const activeTabIdx = consoleIcons[children].idx

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return(
        <button
            className={`console-tab ${activeTab === activeTabIdx ? "active" : ""}`}
            style={{display: consoleIcons[children].enabled ? "" : "none"}}
            onClick={() => setActiveTab(activeTabIdx)}
        >
            {consoleIcons[children].icon}
            <span className="console-tab-text">{children}</span>
        </button>
    )
 }