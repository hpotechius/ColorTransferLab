/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect} from 'react';

import './VideoRenderer.scss';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Renderer for video files.
 ******************************************************************************************************************
 ******************************************************************************************************************/
function VideoRenderer(props) {    

    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    useEffect(() => {
        props.setComplete(Math.random())
    }, [props.filePath]);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className="renderer_video">
            <video id={props.innerid} src={props.filePath} className="renderer_video_inner" width="320" height="240" controls>
                <source type="video/mp4"/>
            </video>
        </div>
    )
}

export default VideoRenderer;