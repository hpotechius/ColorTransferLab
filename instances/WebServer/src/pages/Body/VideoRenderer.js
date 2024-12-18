/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect} from 'react';
import './VideoRenderer.scss';

function VideoRenderer(props) {    

    useEffect(() => {
        props.setComplete(Math.random())
    }, [props.filePath]);

    return (
        <div id={props.id} className="renderer_video">
            <video id={props.innerid} src={props.filePath} className="renderer_video_inner" width="320" height="240" controls>
                <source type="video/mp4"/>
            </video>
        </div>
    )
}

export default VideoRenderer;