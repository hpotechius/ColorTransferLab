"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import json
import importlib.util
import os
import requests
import zipfile
import asyncio
import random
import string
import shutil
from concurrent.futures import ThreadPoolExecutor

# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class Utils:
    # ANSI-Escape-Sequence for colored output
    # ORANGE: General information
    # GREEN: Sending messages
    # BLUE: Receiving messages
    # RED: Warnings and errors
    ORANGE = '\033[33m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

    typeConversion = {
        "png": "Image",
        "jpg": "Image",
        "mp4": "Video",
        "splat": "GaussianSplatting",
        "ksplat": "GaussianSplatting",
        "gsp": "GaussianSplatting",
        "lf": "LightField",
        "lfd": "LightField",
        "ply": "PointCloud",
        "mesh": "Mesh",
        "volu": "VolumetricVideo"
    }

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def generate_random_string(length=4):
        characters = string.ascii_uppercase + string.digits
        return ''.join(random.choice(characters) for _ in range(length))
    
    # ------------------------------------------------------------------------------------------------------------------
    # Helper function to extract an archive to a target folder
    # in_path:  Path to ZIP/.mesh-Datei
    # out_path: Zielordner, in den direkt extrahiert wird (wird angelegt, falls nicht vorhanden)
    #
    # Example
    #   Utils.extract_to_temp(
    #       "files/data/Output/foo.mesh",
    #       "files/data/Output/foo_extracted"
    #   )
    # ------------------------------------------------------------------------------------------------------------------
    def extract_zip(in_path: str, out_path: str):
        os.makedirs(out_path, exist_ok=True)
        with zipfile.ZipFile(in_path, "r") as zf:
            zf.extractall(out_path)

    # ------------------------------------------------------------------------------------------------------------------
    # Check if given URL is reachable (returns True if status code 200, False otherwise)
    # ------------------------------------------------------------------------------------------------------------------
    def is_address_reachable(url):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return True
            else:
                return False
        except requests.ConnectionError:
            return False
        except requests.Timeout:
            return False

    # ------------------------------------------------------------------------------------------------------------------
    # Print an info message to the terminal and window
    # ------------------------------------------------------------------------------------------------------------------
    def printINFO(msg="", window=None):
        extended_msg_terminal = f"{Utils.ORANGE}[INFO] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[INFO] " + msg
        window.print_to_terminal(extended_msg_window, "info")

    # ------------------------------------------------------------------------------------------------------------------
    # Print a message when a message is received, to the terminal and window
    # ------------------------------------------------------------------------------------------------------------------
    def printRECV(msg="", window=None):
        extended_msg_terminal = f"{Utils.BLUE}[RECV] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[RECV] " + msg
        window.print_to_terminal(extended_msg_window, "recv")

    # ------------------------------------------------------------------------------------------------------------------
    # Print a message when a message is sent, to the terminal and window
    # ------------------------------------------------------------------------------------------------------------------
    def printSEND(msg="", window=None):
        extended_msg_terminal = f"{Utils.GREEN}[SEND] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[SEND] " + msg
        window.print_to_terminal(extended_msg_window, "send")

    # ------------------------------------------------------------------------------------------------------------------
    # Print a warning message to the terminal and window
    # ------------------------------------------------------------------------------------------------------------------
    def printWARN(msg="", window=None):
        extended_msg_terminal = f"{Utils.RED}[WARN] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[WARN] " + msg
        window.print_to_terminal(extended_msg_window, "warn")

    # ------------------------------------------------------------------------------------------------------------------
    # Reads a JSON file and returns the data as a Python dictionary.
    # ------------------------------------------------------------------------------------------------------------------
    def read_json_file(filepath):
        try:
            with open(filepath, "r") as file:
                data = json.load(file)
                return data
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            return None
        
    # ------------------------------------------------------------------------------------------------------------------
    # Returns the path of a library if it is installed, otherwise returns None.
    # ------------------------------------------------------------------------------------------------------------------ 
    def get_library_path(library_name):
        spec = importlib.util.find_spec(library_name)
        if spec is None:
            print(f"Library '{library_name}' not found")
            return None
        library_path = spec.origin
        # Remove '__init__.py' from the path
        if library_path.endswith('__init__.py'):
            library_path = os.path.dirname(library_path)
        return library_path
    
    # ----------------------------------------------------------------------------------------------------------------------
    # Returns the structure of the database as a nested dictionary.
    # ----------------------------------------------------------------------------------------------------------------------
    def get_database_structure(path="files/data"):
        out = []

        def get_directory_content(p, arr, name):
            if not os.path.isdir(p):
                return
            directory_contents = os.listdir(p)
            folder = {"name": name, "folders": [], "files": []}
            for item in directory_contents:
                sub_path = p + "/" + item
                if os.path.isfile(sub_path):
                    folder["files"].append(item)
                elif os.path.isdir(sub_path):
                    get_directory_content(sub_path, folder["folders"], item)
                else:
                    print("It is a special file (socket, FIFO, device file) or it doesn't exist.")
            arr.append(folder)

        get_directory_content(path, out, "root")

        return out
    
    # ----------------------------------------------------------------------------------------------------------------------
    # Checks if a folder exists at the given path.
    # ----------------------------------------------------------------------------------------------------------------------
    def check_folder_exists(folder_path):
        return os.path.exists(folder_path) and os.path.isdir(folder_path)

    # ----------------------------------------------------------------------------------------------------------------------
    # Downloads a file from a URL and saves it locally.
    # ----------------------------------------------------------------------------------------------------------------------
    def download_file(url, local_filename, progress_callback=None):
        # Send an HTTP GET request to the URL
        with requests.get(url, stream=True) as response:
            # Check if the request was successful
            response.raise_for_status()
            total_length = response.headers.get('content-length')

            if total_length is None:
                with open(local_filename, 'wb') as file:
                    file.write(response.content)
            else:
                total_length = int(total_length)
                downloaded = 0
                with open(local_filename, 'wb') as file:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            file.write(chunk)
                            downloaded += len(chunk)
                            if progress_callback:
                                progress_callback(downloaded, total_length)
        return local_filename

    # ----------------------------------------------------------------------------------------------------------------------
    # Extracts a ZIP file to the specified folder.
    # ----------------------------------------------------------------------------------------------------------------------
    def extract_zip_file(zip_path, extract_to_folder):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to_folder)

        nested_folder = os.path.join(extract_to_folder, "ColorTransferLab_Database")
        if os.path.isdir(nested_folder):
            for entry in os.listdir(nested_folder):
                source = os.path.join(nested_folder, entry)
                target = os.path.join(extract_to_folder, entry)
                if os.path.exists(target):
                    if os.path.isdir(source) and os.path.isdir(target):
                        shutil.copytree(source, target, dirs_exist_ok=True)
                    else:
                        os.remove(target)
                        shutil.move(source, target)
                else:
                    shutil.move(source, target)
            shutil.rmtree(nested_folder)

        macos_metadata = os.path.join(extract_to_folder, "__MACOSX")
        if os.path.isdir(macos_metadata):
            shutil.rmtree(macos_metadata)

    # ----------------------------------------------------------------------------------------------------------------------
    # Downloads and extracts the database if not already present. The archive will be deleted after extraction.
    # ----------------------------------------------------------------------------------------------------------------------
    async def download_and_extract(window):
        folder_path_data = os.path.abspath("files") + "/data"
        if not Utils.check_folder_exists(folder_path_data):
            Utils.printINFO(f"Download Database...", window)
            archive_name = (
                "ColorTransferLab_Database_reduced.zip"
                if os.environ.get("SPACE_ID")
                else "ColorTransferLab_Database.zip"
            )
            url = (
                "https://huggingface.co/datasets/hpotechius/ColorTransferLabData/"
                f"resolve/main/{archive_name}"
            )
            absolute_folder_path = os.path.abspath("files")
            os.makedirs(absolute_folder_path, exist_ok=True)
            local_filename = os.path.join(absolute_folder_path, archive_name)

            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as pool:
                await loop.run_in_executor(pool, Utils.download_file, url, local_filename, window.update_progress_bar)
                Utils.printINFO(f"Database extracted to {absolute_folder_path}", window)
                await loop.run_in_executor(pool, Utils.extract_zip_file, local_filename, absolute_folder_path)
                os.remove(local_filename)  
        else:
            window.progress_bar.hide()
