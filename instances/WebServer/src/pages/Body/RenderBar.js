/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React from 'react';
import './RenderBar.scss';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** A render bar that shows the progress of the download and the file processing.
 ******************************************************************************************************************
 ******************************************************************************************************************/
const RenderBar = (props) => {    
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
    const download_ID = props.id + "_download";
    const text_ID = props.id + "_text";
    const processing_ID = props.id + "_processing";

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className="renderbar">
            <div id={text_ID} className="renderbar_text">
                Download
            </div>
            <div id={download_ID} className="renderbar_download"/>
            <div id={processing_ID} className="renderbar_processing"/>
        </div>
    )
}

export default RenderBar;