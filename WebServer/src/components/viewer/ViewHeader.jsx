/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import './ViewHeader.scss';
import Box from "@mui/material/Box";
import { useSelection } from "@/contexts/SelectionContext.jsx";
import Button from "@mui/material/Button";
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import useMediaQuery from "@mui/material/useMediaQuery";
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import { useWebRTC } from '@/Utils/WebRTCProvider.jsx';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Header of the viewer, contains the title and the buttons for enabling/disabling the three 
 ** views (SRC, REF, OUT), deleting the local storage, open the user study admin panel, hide/show sidebars/console.
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function ViewHeader({viewButtons, setActiveDownload, setActiveMobile}) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/

    /*------------------------------------------------------------------------------------------------------------
    -- VARIABLES
    -------------------------------------------------------------------------------------------------------------*/
    const isMobile = useMediaQuery("(max-width:900px)");
    const {rtc} = useWebRTC();
    const { selectedAlgorithm } = useSelection(); 
    const { selectedOptions } = useSelection();
    const { selectedSourcePath } = useSelection();
    const { selectedReferencePath } = useSelection();
    const { setSelectedOutputPath } = useSelection();

    /**************************************************************************************************************
     **************************************************************************************************************
     ** FUNCTIONS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Handler for requesting the compute node to start the Color Transfer
     **************************************************************************************************************/
    const handleClickRun = () => {
        if (!selectedSourcePath || !selectedAlgorithm) {
            console.warn("Select a source image and algorithm before running color transfer.");
            return;
        }

        if (selectedAlgorithm.type !== "Colorization" && !selectedReferencePath) {
            console.warn("A reference image is required for this algorithm.");
            return;
        }

        // simple random string helper, length 5 by default
        const generateOutputName = (length = 5) => {
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const timestamp = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            const randomPart = Math.random().toString(36).slice(2, 2 + length);
            return `${timestamp}_${randomPart}`;
        };

        setActiveDownload((prev) => ({ ...prev, out: true }))

        const out_ext = selectedSourcePath.split('.').pop();
        const randomOutputPath = "Output/" + generateOutputName(5);

        localStorage.setItem(`Renderer:filePath:out`, JSON.stringify(randomOutputPath + "." + out_ext));

        setSelectedOutputPath(randomOutputPath + "." + out_ext);

        const data_send = {
            command: "/color_transfer",
            data: {
                approach: selectedAlgorithm.key,
                options: selectedOptions,
                source: selectedSourcePath,
                reference: selectedReferencePath || null,
                output: randomOutputPath,
                mode: "original"
            }
        };
        
        console.debug("SEND", "[COMPUTE NODE] Request to apply Color Transfer via command /color_transfer", data_send);
        rtc.sendMessage(JSON.stringify(data_send));
    };

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <Box className="view_header">
            <Box className="view_header_left">
                <VideoLabelIcon style={{ marginRight: "8px", fontSize: "18px" }} /> 
                VIEW
            </Box>

            <Box className="view_header_buttons">
                <PlayCircleFilledWhiteIcon
                    className="view-play-icon"
                    onClick={() => handleClickRun()}
                />
                {/* Three buttons for enabling/disabling the three views (SRC, REF, OUT) */}
                {viewButtons.map(({ label, isActive, setState, activeMobileState }) => (
                    <Button
                        key={label}
                        size="small"
                        className={isActive ? "active" : ""}
                        onClick={() => (isMobile ? setActiveMobile(activeMobileState) : setState((prevState) => !prevState))}
                    >
                        {label}
                    </Button>
                ))}
            </Box>
        </Box>
    );
}