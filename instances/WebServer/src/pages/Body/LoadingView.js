/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React from 'react';
import "./LoadingView.scss";

const LoadingView = (props) => {
    const gif_loading = "assets/gifs/loading3.gif"

    return (
        <div id={props.id} className="loading-view">
            <img className="loading-view-icon" src={gif_loading}/>
        </div>
    );
  };
  
  export default LoadingView;