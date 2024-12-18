/*
Copyright 2024 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, {useEffect} from 'react';
import $ from 'jquery';
import {consolePrint} from 'Utils/Utils'
import './Terminal.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Terminal(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Prints the initial information message.
     **************************************************************************************************************/
    useEffect(() => {
        // empty the terminal
        $("#console_terminal").html("")

        consolePrint("INFO", "To reveal the available Compute Engines (CE), simply press the button located within the SERVER section. To set up and make your server visible here, please follow the instructions provided on out GitHub page at https://github.com/ImmersiveMediaLaboratory/ColorTransferLab ...")
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className='terminal'/>
    );
}

export default Terminal;