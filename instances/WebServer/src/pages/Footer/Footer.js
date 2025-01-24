/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React from 'react';
import './Footer.scss';


/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 **
 ** Defined the footer of the webpage containing the copyrigth text (name of the author and year).
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Footer(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** STATES & REFERENCES & VARIABLES
     **************************************************************************************************************
     **************************************************************************************************************/
     const currentYear = new Date().getFullYear(); // Get the current year dynamically
     const copyright_footer = `Copyright © ${currentYear} Herbert M. Potechius. All Rights Reserved`;
 

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <footer id='Footer_footer'>{copyright_footer}</footer>
    );
}

export default Footer;