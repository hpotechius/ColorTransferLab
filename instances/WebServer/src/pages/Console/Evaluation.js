/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useEffect } from 'react';
import './Evaluation.scss';
import { createMetricEntries} from 'Utils/Utils';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ** 
 ** Tab within the Console.
 ** Shows evaluation results of an image-to-image color transfer.
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Evaluation(props) {
    /**************************************************************************************************************
     **************************************************************************************************************
     ** HOOKS
     **************************************************************************************************************
     **************************************************************************************************************/

    /**************************************************************************************************************
     * Reads metrics from JSON file and creates empty metric entries.
     **************************************************************************************************************/
    useEffect(() => {
        // set metrics content without server
        const fetchData = async () => {
            try {
                const response = await fetch('metrics.json');
                const jsonData = await response.json();
                createMetricEntries(jsonData["data"])
            } catch (error) {
                console.error('Error fetching JSON data:', error);
            }
        };
    
        fetchData();
    }, []);

    /**************************************************************************************************************
     **************************************************************************************************************
     ** RENDERING
     **************************************************************************************************************
     **************************************************************************************************************/
    return (
        <div id={props.id} className='evaluation'/>
    );
}

export default Evaluation;