![](https://img.shields.io/badge/Also%2C%20check%20out%20the%20Python%20library%20ColorTransferLib%20at-red?style=flat-square) 

https://github.com/hpotechius/ColorTransferLib


<img width="1708" alt="infographic" src="https://github.com/user-attachments/assets/d1675913-75dd-4471-bc0b-134931abab13">

# ColorTransferLabV2
![](https://img.shields.io/badge/ColorTransferLib-2.0.1--2-purple) ![python3.10.12](https://img.shields.io/badge/build-3.10.12-blue?logo=python&label=Python) ![](https://img.shields.io/badge/build-24.04.1%20LTS-orange?logo=ubuntu&label=Ubuntu) ![](https://img.shields.io/badge/build-MIT-purple?label=License) ![](https://img.shields.io/badge/build-6.4.0-brown?logo=octave&label=Octave) ![](https://img.shields.io/badge/build-GeForce%20RTX%204060%20Ti-white?logo=nvidia&label=GPU) ![](https://img.shields.io/badge/build-intel%20Core%20i7--14700KF-white?logo=intel&label=CPU) ![](https://img.shields.io/badge/npm-8.9.0-red?logo=npm) ![](https://img.shields.io/badge/Node.js-16.15.0-green?logo=node.js)

ColorTransferLabV2 is a web-based user interface for the application of **color transfer**, **style transfer**, and **colorization** algorithms on different data types, including **Images**, **Videos**, **Point Clouds**, **Meshes**, **Light Fields**, **Volumetric Videos**, and **Gaussian Splattings**, with the possibility to visualize these data types. Additionally, 20 evaluation metrics are included to assess color transfer results. It is based on our previous tool ColorTransferLab.

This tool is based on WebRTC communication between the client, which is the [User Interface](https://potechius.com/ColorTransferLab), and the compute node, which applies computations using the Python library [ColorTransferLib](https://github.com/hpotechius/ColorTransferLib). This library contains available algorithms and image quality assessment metrics.

## 1. System Architecture
![ColorTransferLabV2-Simple](https://github.com/user-attachments/assets/311b9e51-e59b-479e-8752-8e89fe8fecef)
This system consists of four components: **Client**, **Web Server**, **Signaling Server**, and **Compute Node**, which will be explained in the following sections.

### 1.1 Client and Web Server
The client is the user interface, served by a web server available at https://potechius.com/ColorTransferLab or self-hosted. It allows users to visualize data and connect to an available Compute Node to apply the aforementioned algorithms.

### 1.2 Signaling Server
<img alt="06_signalserverinterface" src="https://github.com/user-attachments/assets/bdc2bfa2-019f-4896-ae82-a7169c6e7f1d" />

To connect two instances, such as the client and compute node, within this WebRTC-based setup, the signaling server announces them to each other. The server is available at https://signal.potechius.com and also displays a list of available instances when accessed via a browser.

### 1.3 Compute Node
![computenodeinterface](https://github.com/user-attachments/assets/ddcc9b13-cee6-4af7-932d-09653d7913a0)
This instance must be provided by the user (see Section 2: Usage). It supplies the necessary data and computational power to apply the algorithms. It is a Python instance with an installed version of ColorTransferLib.

The above image illustrates the three stages of the compute node:

- Initial Stage: The node is only connected to the signaling server, which can also be provided by the user.
- Waiting for Connection: After clicking the "Connect to Signaling Server" button, the compute node registers with the signaling server and enters the Idle state. The compute node now awaits a client connection to begin processing.
- Connected Stage: Client and compute node are connected for peer-to-peer data transmission.

## 2. Usage
### 2.1 Easy Setup
...

### 2.1 Advanced Setup
...

## 3. Datatypes

![414768853-3852256a-8547-4a36-be63-82f064d9f9b5](https://github.com/user-attachments/assets/67b370aa-e218-4a11-a986-8c4c42c0b9c8)

## 4. Interface

<table>
<th align="center">
<img width="441" height="1">
<p> 
<small>
ALGORITHMS SIDEBAR
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td width="25%"><b>Color Transfer</b></td>
    <td>This tab provides a collection of 11 color transfer algorithms.</a>.</td>
  </tr>
  <tr>
    <td width="25%"><b>Style Transfer</b></td>
    <td>This tab provides a collection of 5 style transfer algorithms.</td>
  </tr>
  <tr>
    <td width="25%"><b>Colorization</b></td>
    <td>This tab provides a collection of 3 colorization algorithms.</td>
  </tr>
</table>

<table>
<th align="center">
<img width="441" height="1">
<p> 
<small>
RENDERER AREA
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td width="25%"><b>Source</b></td>
    <td>This area can visualize images and 3D point clouds by dragging it from the Items-Menu and dropping it to this area. The object within this area will be used as *Source*-Input for the color transfer.</td>
  </tr>
  <tr>
    <td width="25%"><b>Reference</b></td>
    <td> </td>
  </tr>
  <tr>
    <td width="25%" align="right"><b>Single Input</b></td>
    <td>This area can visualize images and 3D point clouds by dragging it from the Items-Menu and dropping it to this area. The object within this area will be used as *Reference*-Input for the color transfer.</td>
  </tr>
  <tr>
    <td width="25%" align="right"><b>Color Palette</b></td>
    <td>This area allows the user to select multiple colors which will be used as reference.</td>
  </tr>
  <tr>
    <td width="25%"><b>Output</b></td>
    <td>his area can visualize images and 3D point clouds applying a color transfer algorithm. Only the results can be visualized here. See `Buttons/Start`-Section for more information.</td>
  </tr>
</table>

<table>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DATA SIDEBAR
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td width="25%"><b>Database</b></td>
    <td>Contains a folder structure of available data.</td>
  </tr>
  <tr>
    <td width="25%" align="right"><b>Output</b></td>
    <td>Contains the results which are created by the user.</td>
  </tr>
  <tr>
    <td width="25%" align="right"><b>Uploads</b></td>
    <td>Images which are uploaded, will be available here. See `Buttons/Upload`-Section for more information.</td>
  </tr>
  <tr>
    <td width="25%"><b>Items</b></td>
    <td>Shows the folders and objects which are contained within the corresponding Database-Folder.</td>
  </tr>
</table>

<!---
### Console-Area
1. **Console**  
   ![console](https://user-images.githubusercontent.com/15614886/192982467-3f2b23e3-e88f-475e-a507-a71c999b263c.png)
2. **Evaluation**  
   TODO
3. **Configuration**  
   ![configuration](https://user-images.githubusercontent.com/15614886/192982722-1f3b7d61-c5f3-457d-a27d-8cf40f481b4c.png)
4. **Color Statistics**  
   ![colorstatistics](https://user-images.githubusercontent.com/15614886/192982998-dba4b666-59ba-4fe8-979b-39794ae8f1b5.png)
5. **Information**  
   ![information](https://user-images.githubusercontent.com/15614886/193003445-86d08284-4923-43fd-9e54-5d9bc6546525.png)
--->

<table>
<th align="center">
<img width="441" height="1">
<p> 
<small>
CONSOLE TAB
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td width="25%"><b>Console</b></td>
    <td>Shows information about the current state of the application with corresponding time stamps.</td>
  </tr>
  <tr>
    <td><b>Evaluation</b></td>
    <td>Provides the user with information about objective evaluation metrics after clicking the *Evaluation*-button. See `Buttons/Evaluation`-Section for more information.</td>
  </tr>
  <tr>
    <td><b>Configuration</b></td>
    <td>Configurable parameters will be shown after clicking a chosen color transfer algorithm</td>
  </tr>
  <tr>
    <td><b>Color Statistics</b></td>
    <td>Shows the 2D color histograms for source, reference and output with the respective means and standard deviations.</td>
  </tr>
  <tr>
    <td><b>Information</b></td>
    <td>This area shows general information of the clicked color transfer algorithms.</td>
  </tr>
</table>

<table width="100%" leftmargin=0 rightmargin=0>
<th align="center">
<img width="441" height="1">
<p> 
<small>
BUTTONS
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td><b>Upload</b></td>
    <td>By clicking on this button the user can select an image which will be uploaded to the database. The uploaded object will be availabe in the `Items`-Area after clicking the `Uploads`-Button in the `Database`-Area.</td>
  </tr>
  <tr>
    <td><b>Evaluation</b></td>
    <td>By clicking this button, the evaluation of the output against the source and reference will be performed. This feature is only available for image-to-image color transfer.</td>
  </tr>
  <tr>
    <td><b>Start</b></td>
    <td>By clicking on this button the user starts the color transfer process. The resulting object will be displayed in the `Output`-Renderer. This only works if both a source and a reference object are selected and a color transfer algorithm was chosen.</td>
  </tr>
</table>

<table>
<th align="center">
<img width="441" height="1">
<p> 
<small>
SETTINGS
</small>
</p>
</th>
<th align="center">
<img width="441" height="1">
<p> 
<small>
DESCRIPTION
</small>
</p>
</th>
  <tr>
    <td width="25%"><b>Single View</b></td>
    <td>Toggles between the Single View of the renderer area and the simultaneous view of all three renderers — source, reference, and output.</td>
  </tr>
</table> 

## 5. List of other Color Transfer Tools
- [Palette-based Photo Recoloring](https://recolor.cs.princeton.edu/demo/index.html)
- [L2 Divergence for robust colour transfer: Demo](https://colourtransferdemo.scss.tcd.ie/colourTransferDemo.html)
- [A Web App Implementation for Image Colour Transfer](https://www.dustfreesolutions.com/CT/CT.html)
- [Photo Recoloring](http://b-z.github.io/photo_recoloring/)
- Adobe Photoshop's Color Transfer neural filter

## 6. Acknowledgements
- The light field renderer is adapted from [hypothete's lightfield-webgl2 repository](https://github.com/hypothete/lightfield-webgl2).
- Gaussian Splatting renderer is adapted from [mkkellogg's GaussianSplats3D repository](https://github.com/mkkellogg/GaussianSplats3D)

## 7. Citation
If you utilize this code in your research, kindly provide a citation:
```
@inproceeding{potechius2023,
  title={A software test bed for sharing and evaluating color transfer algorithms for images and 3D objects},
  author={Herbert Potechius, Thomas Sikora, Gunasekaran Raja, Sebastian Knorr},
  year={2023},
  booktitle={European Conference on Visual Media Production (CVMP)},
  doi={10.1145/3626495.3626509}
}
```
