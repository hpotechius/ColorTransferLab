/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./SettingsField.scss";


function SettingsField(props) {

    return (
        <div className="field_settings" style={{ display: props.visibility ? 'block' : 'none' }}>
            <table style={{width:"100%"}}>
                <tbody>
                    {props.children}
                </tbody>
            </table>
        </div>
    )
}

export default SettingsField;