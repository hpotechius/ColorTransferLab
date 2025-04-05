/*
Copyright 2025 by Herbert Potechius,
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


        consolePrint("INFO", 'Registered compute nodes will be listed in the COMPUTE NODE section. To set up and make your compute node available, please follow the instructions provided on our GitHub page at <a href="https://github.com/hpotechius/ColorTransferLab" target="_blank" rel="noopener noreferrer">https://github.com/hpotechius/ColorTransferLab</a>. If you only want to use the algorithms and evaluation metrics, you can use the standalone library at <a href="https://github.com/hpotechius/ColorTransferLib" target="_blank" rel="noopener noreferrer">https://github.com/hpotechius/ColorTransferLib</a>.')
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