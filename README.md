This repository is part of a collection of three repositories. See the links below for the related projects.

[![Button 1](https://img.shields.io/badge/ColorTransferLab-blue)](https://github.com/hpotechius/ColorTransferLab)
[![Button 2](https://img.shields.io/badge/ColorTransferLib-green)](https://github.com/hpotechius/ColorTransferLib)
[![Button 3](https://img.shields.io/badge/ColorTransferAlg-red)](https://github.com/hpotechius/ColorTransferAlg)

<img width="1920" height="1057" alt="03_CTL_interface2" src="https://github.com/user-attachments/assets/4c961333-0f20-44eb-8031-5066b5ed03c7" />

# ColorTransferLab
![](https://img.shields.io/badge/ColorTransferLib-2.2.0-purple) ![python3.12.6](https://img.shields.io/badge/build-3.12.6-blue?logo=python&label=Python) ![](https://img.shields.io/badge/build-24.04.3%20LTS-orange?logo=ubuntu&label=Ubuntu) ![](https://img.shields.io/badge/build-MIT-purple?label=License) ![](https://img.shields.io/badge/build-GeForce%20RTX%204060%20Ti%20|%2016GB-white?logo=nvidia&label=GPU) ![](https://img.shields.io/badge/build-13.2-white?logo=nvidia&label=CUDA) ![](https://img.shields.io/badge/build-intel%20Core%20i7--14700KF-white?logo=intel&label=CPU) ![](https://img.shields.io/badge/npm-11.6.2-red?logo=npm) ![](https://img.shields.io/badge/Node.js-24.11.1-green?logo=node.js)

ColorTransferLab is a web-based user interface for the application of **color transfer**, **style transfer**, and **colorization** algorithms on different data types, including **Images**, **Videos**, **Point Clouds**, **Meshes**, **Light Fields**, **Volumetric Videos**, and **Gaussian Splattings**, with the possibility to visualize these data types. Additionally, 20 evaluation metrics are included to assess color transfer results. It is based on our previous tool ColorTransferLab.

This tool is based on WebRTC communication between the client, which is the [User Interface](https://potechius.com/ColorTransferLab), and the compute node, which applies computations using the Python library [ColorTransferLib](https://github.com/hpotechius/ColorTransferLib). This library contains available algorithms and image quality assessment metrics.

## 1. System Architecture
<img width="2084" height="686" alt="ColorTransferLabV3" src="https://github.com/user-attachments/assets/03b9bd5d-af33-4850-b6ab-47d6a1dfe060" />

This system consists of four components: **Client**, **Web Server**, **Signaling Server**, and **Compute Node**, which will be explained in the following sections.

### 1.1 Client and Web Server
The client is the user interface, served by a web server available at https://potechius.com/ColorTransferLab or self-hosted. It allows users to visualize data and connect to an available Compute Node to apply the aforementioned algorithms.

### 1.2 Signaling Server
<img alt="06_signalserverinterface" src="https://github.com/user-attachments/assets/bdc2bfa2-019f-4896-ae82-a7169c6e7f1d" />

To connect two instances, such as the client and compute node, within this WebRTC-based setup, the signaling server announces them to each other. The server is available at https://signal.potechius.com and also displays a list of available instances when accessed via a browser.

### 1.3 Compute Node
<img width="1280" height="861" alt="ComputeNode" src="https://github.com/user-attachments/assets/56ca56d9-b5e3-42c6-a108-4b77d413c1bb" />
This instance must be provided by the user (see Section 2: Usage). It supplies the necessary data and computational power to apply the algorithms. It is a Python instance with an installed version of ColorTransferLib.

The above image illustrates the three stages of the compute node:

- Initial Stage: The node is only connected to the signaling server, which can also be provided by the user.
- Waiting for Connection: After clicking the "Connect to Signaling Server" button, the compute node registers with the signaling server and enters the Idle state. The compute node now awaits a client connection to begin processing.
- Connected Stage: Client and compute node are connected for peer-to-peer data transmission.

## 2. Setup
In this setup, the signaling server is provided via https://signal.potechius.com, and the user interface is served through the web server at https://potechius.com/ColorTransferLab. The only instance that must be provided by the user is the compute node. Notably, both the signaling server and the web server are included in this repository and can be self-hosted. The following steps must be followed to run the compute node and test the application.

### 2.1 Setup (Compute Node only)
1. Clone the repository and go into the directory
   ```
   git clone git@github.com:hpotechius/ColorTransferLab.git
   cd ColorTransferLab
   ```
2. Create and activate an environment **env** using Python3.12
   ```
   python3.12 -m venv env
   source env/bin/activate
   ```
3. Install the necessary packages
   ```
   pip install -r ComputeNode/requirements.txt
   ```
4. Run the Compute Node
   ```
   cd ComputeNode
   python main_computenode.py
   ```
   - During the first run, the Compute Node will download the reduced dataset from https://huggingface.co/datasets/hpotechius/ColorTransferLabData/resolve/main/ColorTransferLab_Database_reduced.zip.
   - The Compute Node will automatically verify whether the specified signaling server is online.
   - An optional password can be set to limit access.
   - A TURN server can be specified as a fallback.

   To use the browser-based Compute Node interface instead of the Qt window,
   set the web login password and start the web mode:
   ```
   export COMPUTENODE_WEB_PASSWORD='<your-web-password>'
   python main_computenode.py --web
   ```
   Open `http://127.0.0.1:8080` in a browser and log in with the configured
   username `hpotechius` and password. The bind address and port can be
   changed, for example:
   ```
   COMPUTENODE_WEB_PASSWORD='<your-web-password>' \
     python main_computenode.py --web --web-host 0.0.0.0 --web-port 8080
   ```

5. Connect to Signal Server
   - Press the "Connect to Signal Server" button (https://signal.potechius.com).
   - The Compute Node will now enter a waiting state until a client connects to it.
6. Connect to Compute Node
   - Open https://potechius.com/ColorTransferLab in any browser.
   - The Compute Node should now appear in the SERVER section of the web interface. Press the button to view all available algorithms and data.

### 2.2 Local Setup
If you want to run ColorTransferLab completely locally, you have to run also the Signal Server and the Webserver.
   ```
   git clone https://github.com/hpotechius/ColorTransferLab
   ```
#### Signal Server
   ```
   cd SignalingServer
   python3.12 -m venv env
   source env/bin/activate
   pip install -r requirements.txt
   python main_signalingserver.py
   ```
   The signal server will be available at http://localhost:8071.
#### WebServer
In the file `WebServer/src/config.json` change the variable `signalServerURL` to http://localhost:8071.
   ```
   cd WebServer
   npm install
   npm run dev
   ```
   The tool will be available at http://localhost:5173/ColorTransferLab.
#### Compute Node   
In the file `ComputeNode/main_computenode.py` change the Variable `SIGNAL_SERVER` from https://signal.potechius.com to http://localhost:8071.
```
SIGNAL_SERVER = "http://localhost:8071"
# SIGNAL_SERVER = "https://signal.potechius.com"
```

```
  cd ComputeNode
  python3.12 -m venv env
  source env/bin/activate
  pip install -r requirements.txt
  pip install git+https://github.com/facebookresearch/detectron2.git@main

  # Optional: To enable semantic segmentation support
  pip install git+https://github.com/facebookresearch/sam3.git
```

### 2.3 Notes
- Due to the WebRTC-based system architecture, the client and compute node do not need to run on the same system.
- Depending on the network environment, a connection may not always be established using a STUN server. In such cases, a TURN server must be provided.

## 3. Datatypes
<p align="center">
  <img src="https://github.com/user-attachments/assets/69fdfbc9-c64b-4866-bc2d-05399a1418a8" width="800">
  <br>
  <em>Figure 1: Supported data types. Note: Palette Transfer is not currently available.</em>
</p>

## 4. Usage

[![Video Title](https://github.com/user-attachments/assets/4c961333-0f20-44eb-8031-5066b5ed03c7)](https://potechius.com/Videos/ColorTransferLabMin.mp4)
<p align="center">
  <em>Video 1: Usage of the ColorTransferLab interface.</em>
</p>

[![Video Title](https://github.com/user-attachments/assets/33076aac-1ba5-47a8-b5d7-759bb04b8164)](https://potechius.com/Videos/ColorTransferLabUserStudy.mp4)
<p align="center">
  <em>Video 2: Usage of the User Study interface.</em>
</p>

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
  author={Herbert Potechius, Thomas Sikora, Gunasekaran Raja, Sebastian Knorr},
  title={A software test bed for sharing and evaluating color transfer algorithms for images and 3D objects},
  year={2023},
  booktitle={European Conference on Visual Media Production (CVMP)},
  doi={10.1145/3626495.3626509}
}
```

```
@article{potechius2025,
  author = {Herbert Potechius, Thomas Sikora, Sebastian Knorr},
  title = {ColorTransferLabV2: a software testbed for multi-modal color transfer, colorization, and style transfer},
  journal = {Journal of Electronic Imaging},
  editor = {SPIE},
  year = {2025},
  volume = {34},
  issue = {5},
  pages = {1-31},
  doi = {10.1117/1.JEI.34.5.051002},
  url = {https://doi.org/10.1117/1.JEI.34.5.051002}
}
```
