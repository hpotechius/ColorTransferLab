/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import './HeaderEval.scss'

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Header component displaying a timer.
 ******************************************************************************************************************
 ******************************************************************************************************************/
export default function HeaderEval() {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div className="headereval">
            <img className='headereval-logo' src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo"/>
            <div id="headereval_title">ColorTransferEval</div>
        </div>
    );
}
