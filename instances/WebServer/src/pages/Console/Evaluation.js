/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useEffect } from 'react';
import './Evaluation.scss';
import { createMetricEntries, createEmptyEvaluationResults } from 'Utils/Utils';

/******************************************************************************************************************
 ******************************************************************************************************************
 ** FUNCTIONAL COMPONENT
 ******************************************************************************************************************
 ******************************************************************************************************************/
function Evaluation(props) {

    useEffect(() => {
        // set metrics content without server
        const fetchData = async () => {
            try {
                const response = await fetch('metrics.json');
                const jsonData = await response.json();
                createMetricEntries(jsonData["data"])
                //createEmptyEvaluationResults(jsonData["data"])
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