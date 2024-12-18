
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