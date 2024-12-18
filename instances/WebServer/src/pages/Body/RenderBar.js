
import React from 'react';
import './RenderBar.scss';


const RenderBar = (props) => {    

    const download_ID = props.id + "_download";
    const text_ID = props.id + "_text";
    const processing_ID = props.id + "_processing";


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