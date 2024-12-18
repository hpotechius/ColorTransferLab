
import json
import importlib.util
import os
import requests
import zipfile
import asyncio
import random
import string
from concurrent.futures import ThreadPoolExecutor

class Utils:
    # ANSI-Escape-Sequence for colored output
    # ORANGE: General information
    # GREEN: Sending messages
    # BLUE: Receiving messages
    ORANGE = '\033[33m'
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

    typeConversion = {
        "png": "Image",
        "jpg": "Image",
        "mp4": "Video",
        "gsp": "GaussianSplatting",
        "lf": "LightField",
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
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def is_address_reachable(url):
        try:
            response = requests.get(url, timeout=5)
            # Prüfen, ob der Statuscode 200 (OK) ist
            if response.status_code == 200:
                return True
            else:
                return False
        except requests.ConnectionError:
            return False
        except requests.Timeout:
            return False

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def printINFO(msg="", window=None):
        extended_msg_terminal = f"{Utils.ORANGE}[INFO] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[INFO] " + msg
        window.print_to_terminal(extended_msg_window, "info")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def printRECV(msg="", window=None):
        extended_msg_terminal = f"{Utils.BLUE}[RECV] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[RECV] " + msg
        window.print_to_terminal(extended_msg_window, "recv")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def printSEND(msg="", window=None):
        extended_msg_terminal = f"{Utils.GREEN}[SEND] " + msg + f"{Utils.RESET}"
        print(extended_msg_terminal)
        extended_msg_window = f"[SEND] " + msg
        window.print_to_terminal(extended_msg_window, "send")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def read_json_file(filepath):
        try:
            with open(filepath, "r") as file:
                data = json.load(file)  # JSON-Datei lesen und in ein Dictionary umwandeln
                return data
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            return None
        
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------ 
    def get_library_path(library_name):
        spec = importlib.util.find_spec(library_name)
        if spec is None:
            print(f"Library '{library_name}' not found")
            return None
        library_path = spec.origin
        # Entfernen von '__init__.py' aus dem Pfad
        if library_path.endswith('__init__.py'):
            library_path = os.path.dirname(library_path)
        return library_path
    
    # ----------------------------------------------------------------------------------------------------------------------
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    def get_database_structure():
        out = []
        path = "data"

        def get_directory_content(p, arr, name):
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
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    def get_preview_structure():
        out = []
        path = "previews"

        def get_directory_content(p, arr, name):
            directory_contents = os.listdir(p)
            folder = {"name": name, "folders": [], "files": []}
            for item in directory_contents:
                sub_path = p + "/" + item
                if os.path.isfile(sub_path):

                    # with open(sub_path, "rb") as file:
                    #     file_content = file.read()
                    #     base64_string = base64.b64encode(file_content).decode('utf-8')
                    arr.append(sub_path)
                    # sub_path_preview = sub_path.replace("data/", "previews/")
                    # sub_path_preview2 = sub_path_preview.split(".")[0] + ".png"
                    # folder["files"].append({"name": item, "path": sub_path})
                    
                    #print(sub_path)
                elif os.path.isdir(sub_path):
                    get_directory_content(sub_path, arr, item)
                else:
                    print("It is a special file (socket, FIFO, device file) or it doesn't exist.")
            # arr.append(folder)

        get_directory_content(path, out, "root")

        return out
    
    # ----------------------------------------------------------------------------------------------------------------------
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    def check_folder_exists(folder_path):
        return os.path.exists(folder_path) and os.path.isdir(folder_path)

    # ----------------------------------------------------------------------------------------------------------------------
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    def download_file(url, local_filename, progress_callback=None):
        # Senden Sie eine HTTP GET-Anfrage an die URL
        with requests.get(url, stream=True) as response:
            response.raise_for_status()  # Überprüfen Sie, ob die Anfrage erfolgreich war
            total_length = response.headers.get('content-length')

            if total_length is None:  # Keine Inhaltslänge angegeben
                with open(local_filename, 'wb') as file:
                    file.write(response.content)
            else:
                total_length = int(total_length)
                downloaded = 0
                with open(local_filename, 'wb') as file:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:  # Filter out keep-alive new chunks
                            file.write(chunk)
                            downloaded += len(chunk)
                            if progress_callback:
                                progress_callback(downloaded, total_length)
        return local_filename

    # ----------------------------------------------------------------------------------------------------------------------
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    def extract_zip_file(zip_path, extract_to_folder):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to_folder)

    # ----------------------------------------------------------------------------------------------------------------------
    # 
    # ----------------------------------------------------------------------------------------------------------------------
    async def download_and_extract(window):
        folder_path_data = os.path.abspath("files") + "/data"
        folder_path_previews = os.path.abspath("files") + "/previews"
        if not Utils.check_folder_exists(folder_path_data) and not Utils.check_folder_exists(folder_path_previews):
            Utils.printINFO(f"Download Database...", window)
            # url = "https://potechius.com/Downloads/Datasets/Test.zip"
            url = "https://potechius.com/Downloads/Datasets/ColorTransferLab_Database.zip"
            absolute_folder_path = os.path.abspath("files")
            local_filename = absolute_folder_path + "/ColorTransferLab_Database.zip"

            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as pool:
                await loop.run_in_executor(pool, Utils.download_file, url, local_filename, window.update_progress_bar)
                Utils.printINFO(f"Database extracted to {absolute_folder_path}", window)
                await loop.run_in_executor(pool, Utils.extract_zip_file, local_filename, absolute_folder_path)
        else:
            window.progress_bar.hide()
