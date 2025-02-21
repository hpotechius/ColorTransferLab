"""
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import sys
import asyncio
# from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget, QLabel, QFrame
# from PyQt6.QtCore import Qt
# from qasync import QEventLoop, asyncSlot

import uuid
import io
import contextlib
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCDataChannel, RTCConfiguration, RTCIceCandidate
import socketio
import argparse
import requests
import geocoder
import os

import json
import func_timeout
import numpy as np
import sys
from PIL import Image


from utils.interface import Interface
from utils.utils import Utils
from utils.webrtc import WebRTCClient

# Kommandozeilenargumente parsen
parser = argparse.ArgumentParser(description="WebRTC Client")
parser.add_argument("--input", type=str, help="The message to send automatically")
# args = parser.parse_args()

#SIGNAL_SERVER = "http://localhost:8080"
SIGNAL_SERVER = "https://signal.potechius.com"
# SIGNAL_SERVER = "https://relay.potechius.com"
#CLIENT_ID = "56309aa6-4414-4ad5-9bb7-9e7c83eba143"#str(uuid.uuid4())
CLIENT_ID = str(uuid.uuid4())


# # Verbindung zum Signalserver herstellen, ohne die Zertifikatsüberprüfung
# sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=5, ssl_verify=False)

ORANGE = '\033[33m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'


# def scale_and_convert_images(directory):
#     # Iterate over all files in the directory and its subdirectories
#     for root, _, files in os.walk(directory):
#         for filename in files:
#             if filename.lower().endswith('.png'):
#                 file_path = os.path.join(root, filename)
                
#                 # Open the image
#                 with Image.open(file_path) as img:
#                     # Convert image to RGB if it has an alpha channel
#                     if img.mode == 'RGBA':
#                         img = img.convert('RGB')
                    
#                     # Calculate the new width to maintain the aspect ratio
#                     width, height = img.size
#                     new_height = 128
#                     new_width = int((new_height / height) * width)
                    
#                     # Resize the image
#                     img = img.resize((new_width, new_height), Image.LANCZOS)
                    
#                     # Save the image as JPG
#                     new_filename = os.path.splitext(filename)[0] + '.jpg'
#                     new_file_path = os.path.join(root, new_filename)
#                     img.save(new_file_path, 'JPEG')
                    
#                 # Delete the original PNG file
#                 os.remove(file_path)

# # Example usage
# directory = '/home/potechius/Code/ColorTransferLab/instances/ComputeNode/files/previews'
# scale_and_convert_images(directory)
# print("Images scaled and converted to JPG")
# exit()




# ----------------------------------------------------------------------------------------------------------------------
# 
# ----------------------------------------------------------------------------------------------------------------------
async def main_server(window=None):

    Utils.download_and_extract(window)

    client = WebRTCClient(
        signal_server=window.signal_server,
        client_id=CLIENT_ID,
        compute_node_name=window.compute_node_name,
        compute_node_privacy=window.compute_node_privacy,
        window=window
    )
    try:
        await client.connect_to_signal_server()
    except Exception as e:
        Utils.printINFO(f"Error while connecting to signal server.", window)
        return

    # Update the status of the client to online in the user interface
    window.set_signal_server_status("Connected")
    window.set_compute_node_status("Idle")
    window.set_compute_node_id(CLIENT_ID)


    while True:
        # Automatically goes into wait mode
        Utils.printINFO(f"Waiting for incoming connection...", window)
        # Nicht-blockierende Schleife, um auf Verbindung zu warten
        while not client.connection_event.is_set():
            await asyncio.sleep(0.1)


        Utils.printINFO(f"Connection established", window)

        Utils.printSEND(f"Inform Signal Server about new status: Busy", window)
        # Send message to signal server that the status changed to busy.
        await client.send_message({
            "target": "server",
            "from": CLIENT_ID,
            "message": "update_status",
            "data": {
                "status": "Busy",
                "connected_cl": client.connected_cl
            }
        })

        # Warte, bis die Verbindung unterbrochen wird
        while client.connection_event.is_set():
            await asyncio.sleep(1.1)

        Utils.printSEND(f"Inform Signal Server about new status: Idle", window)

        # reset status in user interface for client and compute node
        window.set_compute_node_status("Idle")
        window.set_client_ip_address("null")
        window.set_client_id("null")
        window.set_client_status("null")
        window.set_client_name("null")

        # Send message to signal server that the status changed to Idle.
        await client.send_message({
            "target": "server",
            "from": CLIENT_ID,
            "message": "update_status",
            "data": {
                "status": "Idle",
                "connected_cl": ""
            }
        })

        Utils.printINFO(f"Connection lost. Waiting to reconnect...", window)

def main():
    interfaceObj = Interface(main_server, SIGNAL_SERVER)


    
# ----------------------------------------------------------------------------------------------------------------------
# 
# ----------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    main()

