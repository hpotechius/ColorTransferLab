/*
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import { useState, useEffect, React } from "react";
import $ from 'jquery';

import './PreviewBoard.scss';


export const createPreviewCard = (file_path, file_name, full_path, previews) => {

    let preview_board = $("#body_preview")
    let preview_card = $("<div/>").addClass('preview_card');
    let preview_body = $("<div/>").addClass('preview_body');

    let preview_name = $("<div/>").addClass('preview_name').html(file_name)

    let [file_name_no_ext, ext] = file_name.split(".")

    const img_path = file_path + "/" + file_name_no_ext + ".png"
    const bufArr = previews[img_path]
    const receivedBlob = new Blob([bufArr]);
    const image_path = URL.createObjectURL(receivedBlob);

    let preview_img = $("<img/>").addClass('preview_img').attr("src", image_path)

    function showSrcRefButtons(data, elem){
      // Create a new div element
      let srcDiv = $("<div></div>");
      // You can set the content of the div like this
      srcDiv.addClass("preview_item_source_button").text("Source");
      // Append the new div to items_elem
      $(elem).append(srcDiv);

      // Create a new div element
      let refDiv = $("<div></div>");
      // You can set the content of the div like this
      refDiv.addClass("preview_item_reference_button").text("Reference");
      // Append the new div to items_elem
      $(elem).append(refDiv);

      $(srcDiv).on("click", function(e){
          $("#renderer_src").trigger("itemClicked", [data]); // Trigger a custom event
          console.log(data)
      });

      $(refDiv).on("click", function(e){
          $("#renderer_ref").trigger("itemClicked", [data]); // Trigger a custom event
      });

      $(elem).on("mouseleave", function(e){
          srcDiv.remove();
          refDiv.remove();
      });
    } 

    $(preview_card).on("click", function() {
        // let data = file_path.split("/").pop() + ":" + file_name;
        // console.log(file_path)
        // console.log(file_name)
        showSrcRefButtons(full_path, this)
    });

    $(preview_board).append($(preview_card))
    $(preview_card).append($(preview_body))
    $(preview_card).append($(preview_name))
    $(preview_body).append($(preview_img))
}

/*-----------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------
-- 
-------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------*/
function PreviewBoard(props) {
    const [mobileMaxWidth, setMobileMaxWidth] = useState(null);

    useEffect(() => {
      const styles = getComputedStyle(document.documentElement);
      setMobileMaxWidth(String(styles.getPropertyValue('--mobile-max-width')).trim());
    }, []);

    let previewStyle = {};
    if (window.innerWidth < mobileMaxWidth) {
      previewStyle = {top: "25px", height: "calc(100% - 25px)", width: "calc(100%)", margin: "0px"};
    }

    return (
      <div id={props.id} style={previewStyle}>

      </div>
    );
}

export default PreviewBoard;