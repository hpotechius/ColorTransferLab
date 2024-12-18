/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./ExecutionButton.scss";

function ExecutionButton(props) {
    return (
        <div className="execution_button">
            <img 
                src={props.iconPath} 
                className="execution_button_icon" 
                alt="" 
                title={props.title}
                onClick={props.onClick}
            />
        </div>
    );
}

export default ExecutionButton;