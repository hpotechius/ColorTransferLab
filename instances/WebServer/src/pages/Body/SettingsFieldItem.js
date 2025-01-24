/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import "./SettingsFieldItem.scss";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function SettingsFieldItem(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return(
        <tr className="field_settings_item">
            <td className='field_settings_table_cell'>{props.children}</td>
            <td className='field_settings_table_cell'>
                <input 
                    type={props.type}
                    defaultChecked={props.default}
                    onChange={props.onChange} 
                    {...(props.type !== 'range' ? { defaultChecked: props.default } : {})}
                    {...(props.type === 'range' ? { 
                        min: props.min, 
                        max: props.max, 
                        ...(props.default !== undefined ? { defaultValue: props.default } : {}),
                        ...(props.value !== undefined ? { value: props.value } : {})
                    } : {})}
                />
            </td>
        </tr>
    )
}

export default SettingsFieldItem;