/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import { useEffect } from "react";
import "./InfoField.scss";


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function InfoField(props) {

    useEffect(() => {
        //console.log("InfoField useEffect");
    }, [props.children]);
    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div className="field_info" style={{ display: props.visibility ? 'block' : 'none' }}>
            <table style={{width:"100%"}}>
                <tbody>
                    {Object.entries(props.children).map(([key, value], index) => (
                        <tr className="field_info_item" key={index}>
                            <td className='field_info_table_cell'>{key}</td>
                            <td className='field_info_table_cell'>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default InfoField;