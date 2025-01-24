from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCDataChannel, RTCConfiguration, RTCIceCandidate
import asyncio
import requests
import geocoder
import os
import json
from os import path 
import func_timeout
import socketio
from PIL import Image as PILImage
import sys

from ColorTransferLib.ColorTransfer import ColorTransfer, ColorTransferEvaluation
from ColorTransferLib.MeshProcessing.Mesh import Mesh
from ColorTransferLib.DataTypes.GaussianSplatting import GaussianSplatting
from ColorTransferLib.DataTypes.LightField import LightField
from ColorTransferLib.MeshProcessing.VolumetricVideo import VolumetricVideo
from ColorTransferLib.ImageProcessing.Image import Image
from ColorTransferLib.ImageProcessing.Video import Video
from utils.utils import Utils

# ORANGE = '\033[33m'
# GREEN = '\033[92m'
# BLUE = '\033[94m'
# RESET = '\033[0m'


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class WebRTCClient:
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init__(self, message=None, signal_server=None, client_id=None, window=None, compute_node_name=None, compute_node_privacy=None):
        # Verbindung zum Signalserver herstellen, ohne die Zertifikatsüberprüfung
        self.sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=0, ssl_verify=False, request_timeout=600)

        self.connection_event = asyncio.Event()
        self.message = "X"
        self.reset_peer_connection()
        self.chunk_size = 1048576 # 1MB 
        #self.chunk_size = 16000 # 16KB 

        self.connected_cl = ""

        self.signal_server = signal_server
        self.client_id = client_id
        self.window = window
        self.compute_node_name = compute_node_name
        self.compute_node_privacy = compute_node_privacy
        self.compute_node_ip_address = None

        self.received_arraybuffer = []
        self.received_file_name = ""

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def reset_peer_connection(self):
        ice_servers = [
            RTCIceServer(urls="stun:stun.l.google.com:19302")  # Google's public STUN server
        ]

        self.pc = RTCPeerConnection(RTCConfiguration(iceServers=ice_servers))
        #self.pc = RTCPeerConnection()
        self.channel = None

        self.pc.on("icecandidate", self.on_icecandidate)
        self.pc.on("datachannel", self.on_datachannel)
        self.pc.on("iceconnectionstatechange", self.on_iceconnectionstatechange)
        self.pc.on("connectionstatechange", self.on_connectionstatechange)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def connect_to_signal_server(self):
        ip_adress = requests.get('https://api.ipify.org?format=json').json()['ip']
        country = geocoder.ip(ip_adress).country

        Utils.printSEND(f"Connect to Singal Server {self.signal_server}", self.window)

        await self.sio.connect(self.signal_server)
        await self.sio.emit("register", 
                       {
                            "name": self.compute_node_name,
                            "type": "ComputeNode",
                            "client_id": self.client_id,
                            "country": country,
                            "privacy": self.compute_node_privacy
                        })
        
        Utils.printINFO(f"Connected to Signal Server as {self.client_id}", self.window)

        @self.sio.on("message")
        async def handle_message(data):
            if data["type"] == "offer":
                sender = data["from"]
                Utils.printRECV(f"Received Offer from {sender}", self.window)
                # Check privacy settings
                # print(self.compute_node_privacy)
                # print(self.compute_node_ip_address)
                # print(data)
                # if self.compute_node_privacy == False:
                self.connected_cl = data["from"]
                await self.on_offer(data["sdp"], data["from"])
                self.connection_event.set()
                # else:
                #     Utils.printINFO(f"Privacy settings are set to private. Connection request from {sender} is ignored.", self.window)
            elif data["type"] == "answer":
                print("Processing answer...")
                await self.on_answer(data["sdp"])
                self.connection_event.set()
            elif data["type"] == "candidate":
                Utils.printRECV(f"Processing candidate...", self.window)
                await self.on_candidate(data["candidate"])
            else:
                Utils.printRECV(f"Received unknown message type", self.window)


        @self.sio.on("/ip_address")
        async def handle_ip_address(data):
            Utils.printRECV(f"Received Message from Signal Server: Compute Node IP Address: {data}", self.window)
            self.window.set_compute_node_ip_address(data)
            self.compute_node_ip_address = data

        @self.sio.event
        async def disconnect():
            Utils.printINFO("Disconnected from Signal Server", self.window)
            # self.window.set_compute_node_id("null")
            # self.window.set_compute_node_status("Idle")

            # await self.sio.disconnect()
            # Utils.printINFO("Manually disconnected from Signal Server", self.window)

            # # Erneute Verbindung herstellen
            # await self.sio.connect(self.signal_server)

            try:
                self.sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=0, ssl_verify=False, request_timeout=600)
                await self.sio.connect(self.signal_server)
                await self.sio.emit("register", 
                    {
                        "name": self.compute_node_name,
                        "type": "ComputeNode",
                        "client_id": self.client_id,
                        "country": country,
                        "privacy": self.compute_node_privacy
                    })

                Utils.printINFO(f"Reconnected to Signal Server as {self.client_id}", self.window)
            except Exception as e:
                Utils.printINFO(f"Error while reconnecting to signal server.", self.window)
                self.window.set_signal_server_status("Offline")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def send_message(self, data):
        await self.sio.emit("message", data)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def create_offer(self, target):
        print("Creating offer...")
        self.channel = self.pc.createDataChannel("chat", 
                                                {
                                                    "reliable": True,
                                                    # "ordered": True,  # Ensure messages are delivered in order
                                                    # "maxRetransmits": -1  # Unlimited retransmissions for reliability
            })
        self.channel.on("open", self.on_channel_open)
        self.channel.on("message", lambda message: asyncio.create_task(self.on_message(message)))

        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)

        print("Offer created, sending to target...")
        await self.send_message({
            "type": "offer",
            "sdp": self.pc.localDescription.sdp,
            "target": target,
            "from": self.client_id,
        })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_offer(self, sdp, from_client):
        Utils.printINFO(f"Setting up connection...", self.window)
        offer = RTCSessionDescription(sdp, "offer")
        await self.pc.setRemoteDescription(offer)

        answer = await self.pc.createAnswer()
        await self.pc.setLocalDescription(answer)

        Utils.printSEND(f"Sending answer to target {from_client}", self.window)

        await self.send_message({
            "type": "answer",
            "sdp": self.pc.localDescription.sdp,
            "target": from_client,
            "from": self.client_id,
        })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_answer(self, sdp):
        print("Answer received. Completing connection...")
        answer = RTCSessionDescription(sdp, "answer")
        await self.pc.setRemoteDescription(answer)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_icecandidate(self, candidate):
        print("ICE candidate received")
        # print(target)
        if candidate:
            Utils.printSEND(f"Sending ICE candidate", self.window)
            await self.send_message({
                "type": "candidate",
                "candidate": {
                    "candidate": candidate.candidate,
                    "sdpMid": candidate.sdpMid,
                    "sdpMLineIndex": candidate.sdpMLineIndex,
                    "usernameFragment": candidate.usernameFragment
                },
                # "target": target,
                "target": self.connected_cl,
                "from": self.client_id,
            })

    async def on_candidate(self, candidate_data):
        Utils.printINFO(f"Add ICE candidate", self.window)
        print(candidate_data["candidate"])
        candidate_array = candidate_data["candidate"].split(" ")
        foundation = candidate_array[0]
        component = candidate_array[1]
        protocol = candidate_array[2]
        priority = candidate_array[3]
        ip = candidate_array[4]
        port = candidate_array[5]
        typ = candidate_array[7]

        candidate = RTCIceCandidate(
            component=int(component),
            foundation=foundation,
            ip=ip,
            port=int(port),
            priority=int(priority),
            protocol=protocol,
            type=typ,
            sdpMid=candidate_data["sdpMid"],
            sdpMLineIndex=candidate_data["sdpMLineIndex"],
        )

        await self.pc.addIceCandidate(candidate)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_datachannel(self, channel: RTCDataChannel):
        Utils.printINFO(f"DataChannel created on wait side.", self.window)
        self.channel = channel
        self.channel.on("open", self.on_channel_open)
        self.channel.on("message", lambda message: asyncio.create_task(self.on_message(message)))

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_channel_open(self):
        print("DataChannel is now open!")
        print(f"Sending input message: XXX")
        self.send_datachannel_message("XXX")


    # ------------------------------------------------------------------------------------------------------------------
    # Divides the file into chunks and sends them
    # ------------------------------------------------------------------------------------------------------------------
    async def sendFileChunks(self, filepath, ext):
        self.send_datachannel_message(str({"message": "fileTransferStart","data" :ext}))
        with open(filepath, "rb") as file:
            while True:
                chunk = file.read(self.chunk_size)
                if not chunk:
                    break
                self.send_datachannel_message(chunk)
                await asyncio.sleep(0.01)  
        self.send_datachannel_message(str({"message": "fileTransferEnd","data" :""}))

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendImageFiles(self, data_recv):
        filepath = path.join("data", data_recv)
        # TODO: Can also be jpg
        await self.sendFileChunks(filepath, "png")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendVideoFiles(self, data_recv):
        filepath = path.join("data", data_recv)
        await self.sendFileChunks(filepath, "mp4")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendPointCloudFiles(self, data_recv):
        filepath = path.join("data", data_recv)
        await self.sendFileChunks(filepath, "ply")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendGaussianSplattingFiles(self, data_recv):
        filepath_wo_gsp = data_recv.split(".")[0]
        filepath_wo_ext = filepath_wo_gsp.split("-")[0]
        filepath_ext = filepath_wo_gsp.split("-")[1]
        filepath = path.join("data", filepath_wo_ext + "." + filepath_ext)
        await self.sendFileChunks(filepath, filepath_ext)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendLightFieldFiles(self, data_recv):
        filepath_wo_lf = data_recv.split(".")[0]
        filepath = path.join("data", filepath_wo_lf + ".mp4")
        metapath = path.join("data", filepath_wo_lf + ".json")

        await self.sendFileChunks(metapath, "json")
        await self.sendFileChunks(filepath, "mp4")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendMeshFiles(self, data_recv):
        Utils.printINFO(f"Preparing Container: {data_recv}", self.window)
        filepath_wo_mesh = data_recv.split(".")[0]
        objpath = path.join("data", filepath_wo_mesh + ".obj")
        mtlpath = path.join("data", filepath_wo_mesh + ".mtl")
        pngpath = path.join("data", filepath_wo_mesh + ".png")

        await self.sendFileChunks(pngpath, "png")
        await self.sendFileChunks(mtlpath, "mtl")
        await self.sendFileChunks(objpath, "obj")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendVolumetricVideoFiles(self, data_recv):
        #print(data_recv)
        filepath_wo_volu = data_recv.split(".")[0]
        jsonpath = path.join("data", filepath_wo_volu + ".json")

        jsondata = Utils.read_json_file(jsonpath)
        num_frames = jsondata["num_frames"]

        await self.sendFileChunks(jsonpath, "json")
        
        for i in range(num_frames):
            formatted_i = str(i).zfill(5)

            objpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".obj")
            mtlpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".mtl")
            pngpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".jpg")

            await self.sendFileChunks(pngpath, "png")
            await self.sendFileChunks(mtlpath, "mtl")
            await self.sendFileChunks(objpath, "obj")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def get_container_size(self, abs_path, container_type):
        if container_type == "Image" or container_type == "Video" or container_type == "PointCloud":
            filepath = path.join("data", abs_path)
            file_size = os.path.getsize(filepath)
        elif container_type == "GaussianSplatting":
            filepath_wo_gsp = abs_path.split(".")[0]
            filepath_wo_ext = filepath_wo_gsp.split("-")[0]
            filepath_ext = filepath_wo_gsp.split("-")[1]
            filepath = path.join("data", filepath_wo_ext + "." + filepath_ext)
            file_size = os.path.getsize(filepath)
        elif container_type == "LightField":
            filepath_wo_lf = abs_path.split(".")[0]
            filepath = path.join("data", filepath_wo_lf + ".mp4")
            metapath = path.join("data", filepath_wo_lf + ".json")
            file_size = os.path.getsize(filepath) + os.path.getsize(metapath)
        elif container_type == "Mesh":
            filepath_wo_mesh = abs_path.split(".")[0]
            objpath = path.join("data", filepath_wo_mesh + ".obj")
            mtlpath = path.join("data", filepath_wo_mesh + ".mtl")
            pngpath = path.join("data", filepath_wo_mesh + ".png")
            file_size = os.path.getsize(objpath) + os.path.getsize(mtlpath) + os.path.getsize(pngpath)
        elif container_type == "VolumetricVideo":
            filepath_wo_volu = abs_path.split(".")[0]
            jsonpath = path.join("data", filepath_wo_volu + ".json")

            jsondata = Utils.read_json_file(jsonpath)
            num_frames = jsondata["num_frames"]
            file_size = os.path.getsize(jsonpath)
            
            for i in range(num_frames):
                formatted_i = str(i).zfill(5)

                objpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".obj")
                mtlpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".mtl")
                pngpath = path.join("data", filepath_wo_volu + "_" + formatted_i + ".jpg")

                file_size += os.path.getsize(pngpath) + os.path.getsize(mtlpath) + os.path.getsize(objpath)
        else:
            file_size = 0
        return file_size
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendFiles(self, data_recv, container_type):
        abs_path = data_recv["abstractPath"]

        container_size = self.get_container_size(abs_path, container_type)

        self.send_datachannel_message(str({
            "message": "containerTransferStart",
            "data" : {
                "rid": data_recv["rid"],
                "type": container_type,
                "abstractPath": data_recv["abstractPath"],
                "size": container_size
            }
        }))


        if container_type == "Image":
            Utils.printSEND(f"Sending Image Data.", self.window)
            await self.sendImageFiles(abs_path)
        elif container_type == "Video":
            Utils.printSEND(f"Sending Video Data.", self.window)
            await self.sendVideoFiles(abs_path)
        elif container_type == "PointCloud":
            Utils.printSEND(f"Sending PointCloud Data.", self.window)
            await self.sendPointCloudFiles(abs_path)
        elif container_type == "GaussianSplatting":
            Utils.printSEND(f"Sending GaussianSplatting Data.", self.window)
            await self.sendGaussianSplattingFiles(abs_path)
        elif container_type == "LightField":
            Utils.printSEND(f"Sending LightField Data.", self.window)
            await self.sendLightFieldFiles(abs_path)
        elif container_type == "Mesh":
            Utils.printSEND(f"Sending Mesh Data.", self.window)
            await self.sendMeshFiles(abs_path)
        elif container_type == "VolumetricVideo":
            Utils.printSEND(f"Sending VolumetricVideo Data.", self.window)
            await self.sendVolumetricVideoFiles(abs_path)
        self.send_datachannel_message(str({"message": "containerTransferEnd","data" :""}))

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def createRefColorThemeImage(self, colors, ref_path):
        # Bildgröße
        width, height = 256, 256

        # Anzahl der Farben
        num_colors = len(colors)

        # Breite jedes Streifens
        stripe_width = width // num_colors

        # Neues Bild erstellen
        image = PILImage.new("RGB", (width, height))

        # Pixelzugriff-Objekt
        pixels = image.load()

        # Farben als vertikale Streifen zeichnen
        for i, color in enumerate(colors):
            # Hex-Farbe in RGB umwandeln
            color = color.lstrip('#')
            rgb = tuple(int(color[j:j+2], 16) for j in (0, 2, 4))

            # Streifen zeichnen
            for x in range(i * stripe_width, (i + 1) * stripe_width):
                for y in range(height):
                    pixels[x, y] = rgb

        # Restliche Pixel mit der letzten Farbe füllen, falls die Streifen nicht genau aufgehen
        for x in range(num_colors * stripe_width, width):
            for y in range(height):
                pixels[x, y] = rgb

        # Bild speichern
        image.save(ref_path)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def handlerColorTransfer(self, data_recv):
        src_path = os.path.join("data", data_recv["source"])

        ref_type = data_recv["reference"]["type"]
        if ref_type == "Single Input":
            ref_path = os.path.join("data", data_recv["reference"]["value"])
            print("Single Input")
        elif ref_type == "Color Theme":
            ref_colors= data_recv["reference"]["value"]
            ref_path = os.path.join("data/Output", "color_theme_image.png")
            self.createRefColorThemeImage(ref_colors, ref_path)
            print("Color Theme")

        print(src_path)
        print(ref_path)

        method_id = data_recv["approach"]
        method_options = data_recv["options"]

        file_src_extension = src_path.split(".")[1]
        if ref_path != "data/":
            file_ref_extension = ref_path.split(".")[1]
        else:
            file_ref_extension = "empty"
        print(file_src_extension)
        print(file_ref_extension)

        # output_path = os.path.join("data", data_recv["output"] + "." + file_src_extension)
        output_path_wo_ext = os.path.join("data", data_recv["output"])
        print(output_path_wo_ext)

        
        if file_src_extension == "png" or file_src_extension == "jpg":
            src = Image(file_path=src_path)
            abs_path = data_recv["output"] + "." + file_src_extension
        elif file_src_extension == "ply":
            src = Mesh(file_path=src_path, datatype="PointCloud")
            abs_path = data_recv["output"] + "." + file_src_extension
        elif file_src_extension == "mp4":
            src = Video(file_path=src_path,)
            abs_path = data_recv["output"] + "." + file_src_extension
        elif file_src_extension == "mesh":
            # remove .mesh from file name
            src_path_wo_ext = src_path.split(".")[0]
            # create .obj file path
            obj_src_path = src_path_wo_ext + ".obj"
            print(obj_src_path)
            # construct new output path
            filename = data_recv["output"].split("/")[-1]
            output_folder = os.path.join("data/Output", "$mesh$" + filename)
            os.makedirs(output_folder, exist_ok=True)
            output_path_wo_ext = os.path.join(output_folder,filename)
            src = Mesh(file_path=obj_src_path, datatype="Mesh")
            abs_path = "Output/" + "$mesh$" + filename + "/" + filename + ".mesh"
        elif file_src_extension == "gsp":
            # remove .gsp from file name
            src_path_wo_ext = src_path.split(".")[0]
            splitted = src_path_wo_ext.split("-")
            obj_src_path = splitted[0] + "." + splitted[1]
            src = GaussianSplatting(file_path=obj_src_path)

            # construct new output path
            filename = data_recv["output"].split("/")[-1]
            output_folder = os.path.join("data/Output", "$gaussiansplat$" + filename)
            os.makedirs(output_folder, exist_ok=True)
            output_path_wo_ext = os.path.join(output_folder, filename)
            abs_path = "Output/" + "$gaussiansplat$" + filename + "/" + filename + "-splat.gsp"
            print(abs_path)
        elif file_src_extension == "lf":
            # remove .lf from file name
            src_path_wo_ext = src_path.split(".")[0]
            # create .obj file path
            obj_src_path = src_path_wo_ext + ".mp4"
            print(obj_src_path)
            # construct new output path
            filename = data_recv["output"].split("/")[-1]
            output_folder = os.path.join("data/Output", "$lightfield$" + filename)
            os.makedirs(output_folder, exist_ok=True)
            output_path_wo_ext = os.path.join(output_folder,filename)

            # read lightfield meta data
            json_path = src_path_wo_ext + ".json"
            with open(json_path, 'r') as f:
                lightfield_meta = json.load(f)
                grid_width = lightfield_meta["grid_width"]
                grid_height = lightfield_meta["grid_height"]
            
            json_out_path = "data/Output/" + "$lightfield$" + filename + "/" + filename + ".json"
            with open(json_out_path, 'w') as json_file:
                json.dump(lightfield_meta, json_file, indent=4)

            src = LightField(file_path=obj_src_path, size=(grid_width, grid_height))
            abs_path = "Output/" + "$lightfield$" + filename + "/" + filename + ".lf"
        elif file_src_extension == "volu":
            # remove .lf from file name
            src_path_wo_ext = src_path.split(".")[0]

            src_name = src_path_wo_ext.split("/")[-1]
            # create .obj file path
            # obj_src_path = src_path_wo_ext + ".obj"
            # print(obj_src_path)
            # construct new output path
            input_folder = os.path.dirname(src_path)

            filename = data_recv["output"].split("/")[-1]
            output_folder = os.path.join("data/Output", "$volumetric$" + filename)
            os.makedirs(output_folder, exist_ok=True)
            # output_path_wo_ext = os.path.join(output_folder,filename)
            output_path_wo_ext = os.path.join("data/Output", filename)

            # read volumetric meta data
            json_path = src_path_wo_ext + ".json"
            with open(json_path, 'r') as f:
                volumetric_meta = json.load(f)
                num_frames = volumetric_meta["num_frames"]
            
            json_out_path = "data/Output/" + "$volumetric$" + filename + "/" + filename + ".json"
            with open(json_out_path, 'w') as json_file:
                json.dump(volumetric_meta, json_file, indent=4)

            src = VolumetricVideo(folder_path=input_folder, file_name=src_name)
            abs_path = "Output/" + "$volumetric$" + filename + "/" + filename + ".volu"
        else:
            src = Image(file_path=src_path)



        if file_ref_extension == "png" or file_ref_extension == "jpg":
            ref = Image(file_path=ref_path)
        elif file_ref_extension == "ply":
            ref = Mesh(file_path=ref_path, datatype="PointCloud")
        elif file_ref_extension == "mesh":
            # remove .mesh from file name
            ref_path_wo_ext = ref_path.split(".")[0]
            # create .obj file path
            obj_ref_path = ref_path_wo_ext + ".obj"
            ref = Mesh(file_path=obj_ref_path, datatype="Mesh")
        elif file_ref_extension == "gsp":
            # remove .gps from file name
            ref_path_wo_ext = ref_path.split(".")[0]
            splitted = ref_path_wo_ext.split("-")
            obj_ref_path = splitted[0] + "." + splitted[1]
            ref = GaussianSplatting(file_path=obj_ref_path)
        else:
            ref = None


        ct = ColorTransfer(src, ref, method_id)
        ct.set_options(method_options)


        output = func_timeout.func_timeout(240, ct.apply, args=(), kwargs=None)


        # response = {
        #     "message": "color_transfer",
        #     "status": "0",
        #     "data": ""
        # }

        print(output)

        if output["status_code"] == -1:
            return
        
        output["object"].write(output_path_wo_ext)

        # Create file path depending on received file extension
        Utils.printSEND(f"Sending Files...", self.window)
        convertedType = Utils.typeConversion[file_src_extension]
        Utils.printINFO(f"Handling {convertedType} File.", self.window)
        # extend recieved dictionary with necessary information
        data_recv["abstractPath"] = abs_path
        data_recv["rid"] = "out"
        await self.sendFiles(data_recv, convertedType)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def handlerEvaluation(self, data_recv):
        src_path = os.path.join("data", data_recv["source"])
        ref_path = os.path.join("data", data_recv["reference"])
        out_path = os.path.join("data", data_recv["output"])

        src_img = Image(file_path=src_path)
        ref_img = Image(file_path=ref_path)
        out_img = Image(file_path=out_path)

        # get all metrics and add to response["data"]
        cte = ColorTransferEvaluation(src_img, ref_img, out_img)
        # metrics = ColorTransferEvaluation.get_available_metrics()
        metrics = ["PSNR", "HI", "Corr", "BA", "MSE", "RMSE", "CF", "MSSSIM", "SSIM", "GSSIM", "IVSSIM", "IVEGSSIM", "FSIM", "BRISQUE", "NIQE", "VSI", "CTQM", "LPIPS", "NIMA", "CSS"]
        evalval = "none"
        for mm in metrics:
            evalval = cte.apply(mm)
            # if np.isinf(evalval) or np.isnan(evalval):
            #     evalval = 99999

            Utils.printSEND(f"Sending Evaluation Result for {mm}.", self.window)
            print(evalval)
            self.send_datachannel_message(str({
                "message": "evaluation",
                "data" : {
                    "metric": mm,
                    "value": evalval
                }
            }))
            await asyncio.sleep(0.01)  

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_message(self, message):
        if isinstance(message, bytes):
            print("Die Nachricht ist vom Typ bytes.")
            self.received_arraybuffer.append(message)
            # Weitere Verarbeitung für bytes
        else:
            data_recv_string = json.loads(message)
            command_recv = data_recv_string["command"]
            print(command_recv)
            data_recv = data_recv_string["data"]

            if command_recv == "dbStructure":
                db_structure = Utils.get_database_structure()

                # # Größe des Objekts selbst
                # size_in_bytes = sys.getsizeof(db_structure)
                # print(f"Größe von db_structure (Objekt selbst): {size_in_bytes} Bytes")

                # # Größe des serialisierten Objekts
                # serialized_db_structure = json.dumps(db_structure)
                # size_in_bytes_serialized = sys.getsizeof(serialized_db_structure)
                # print(f"Größe von db_structure (serialisiert): {size_in_bytes_serialized} Bytes")

                test = [{'name': 'root', 'folders': [{'name': 'PointClouds', 'folders': [], 'files': ['Orange.ply',]}]}]

                Utils.printRECV(f"Client requests database structure via command: dbStructure.", self.window)
                Utils.printSEND(f"Sending database structure.", self.window)

                self.send_datachannel_message(str({
                    "message": "dbStructure",
                    "data" : db_structure
                }))

                return

            elif command_recv == "/upload_start":
                Utils.printRECV(f"Client requests start of upload of file via command: /upload_start.", self.window)
                self.received_arraybuffer = []
                self.received_file_name = data_recv
            elif command_recv == "/upload_end":
                Utils.printRECV(f"Client requests end of upload of file via command: /upload_end.", self.window)
                # Zusammenführen der Byte-Chunks
                combined_bytes = b''.join(self.received_arraybuffer)

                # Speichern der resultierenden Bytes als PNG-Datei
                fpath = path.join("data/Uploads/" + self.received_file_name)
                with open(fpath, 'wb') as f:
                    f.write(combined_bytes)
                self.received_arraybuffer = []
                self.received_file_name = ""

                Utils.printSEND(f"Sending updated database structure.", self.window)
                db_structure = Utils.get_database_structure()
                self.send_datachannel_message(str({
                    "message": "dbStructure",
                    "data" : db_structure
                }))

            elif command_recv == "/ip_address":
                Utils.printRECV(f"Client send own information via command: /ip_address.", self.window)

                self.window.set_client_ip_address(data_recv["ip_address"])
                self.window.set_client_id(data_recv["client_id"])
                self.window.set_compute_node_status("Connected")
                self.window.set_client_status("Connected")
                self.window.set_client_name(data_recv["client_name"])
                return
            elif command_recv == "previews":
                preview_structure = Utils.get_preview_structure()            
                Utils.printRECV(f"Client requests previews via command: /previews.", self.window)
                Utils.printSEND(f"Sending previews images.", self.window)

                self.send_datachannel_message(str({"message": "previewsTransferStart","data" : ""}))
                # for preview in preview_structure:
                #     print(f"{GREEN}[SEND] Sending preview image: {preview}.{RESET}")
                #     self.send_datachannel_message(str({"message": "previewfileTransferStart","data" : preview}))
                #     await self.sendFileChunks(preview, "png")
                #     self.send_datachannel_message(str({"message": "previewfileTransferEnd","data" : ""}))
                self.send_datachannel_message(str({"message": "previewsTransferEnd","data" : ""}))
                Utils.printSEND(f"Sending preview images done.", self.window)

                # self.send_datachannel_message(str({
                #     "message": "previews",
                #     "data" : db_structure
                # }))
                return
            elif command_recv == "/file":
                Utils.printRECV(f"Client requests file via command: {message}.", self.window)

                # Create file path depending on received file extension
                file_extension = data_recv["abstractPath"].split(".")[1]

                try:
                    Utils.printSEND(f"Sending Files...", self.window)
                    convertedType = Utils.typeConversion[file_extension]
                    Utils.printINFO(f"Handling {convertedType} File.", self.window)
                    await self.sendFiles(data_recv, convertedType)

                except Exception as e:
                    print(f"Error sending file: {e}")
                return
            elif command_recv == "/methods":
                Utils.printRECV(f"Client requests list of methods via: {message}.", self.window)
                methodsStruct = Utils.read_json_file("meta/methods.json")
                availableMethods = methodsStruct["data"]

                Utils.printINFO(f"Read options for all available methods.", self.window)

                av_methods = {}
                for met in availableMethods:
                    # dirname = os.path.dirname(__file__)
                    dirname = Utils.get_library_path("ColorTransferLib")
                    filename = os.path.join(dirname, "Options/" + met["key"] + ".json")

                    with open(filename, 'r') as f:
                        options = json.load(f)

                    av_methods[met["key"]] = options


                self.send_datachannel_message(str({
                    "message": "methods",
                    "data" : {
                        "methods": availableMethods,
                        "options": av_methods
                    }
                }))

            elif command_recv == "/color_transfer":
                Utils.printRECV(f"Client requests color transfer via: {command_recv}.", self.window)
                #print(data_recv)
                await self.handlerColorTransfer(data_recv)
                # asyncio.create_task(self.handlerColorTransfer(data_recv))

                Utils.printSEND(f"Sending updated database structure.", self.window)
                db_structure = Utils.get_database_structure()
                self.send_datachannel_message(str({
                    "message": "dbStructure",
                    "data" : db_structure
                }))
            elif command_recv == "/evaluation":
                Utils.printRECV(f"Client requests evaluation via: {command_recv} for metric: {data_recv}.", self.window)
                await self.handlerEvaluation(data_recv)
            else:
                Utils.printRECV(f"Invalid received message: {message}.", self.window)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def send_datachannel_message(self, message):
        if self.channel and self.channel.readyState == "open":
            print("Sending message")
            #print(f"Sending message: {message}")
            self.channel.send(message)
        else:
            print("DataChannel is not open yet.")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_iceconnectionstatechange(self):
        Utils.printINFO(f"ICE connection state: {self.pc.iceConnectionState}.", self.window)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_connectionstatechange(self):
        Utils.printINFO(f"Connection state: {self.pc.connectionState}.", self.window)
        if self.pc.connectionState == "closed":
            self.connection_event.clear()
            self.reset_peer_connection()
        elif self.pc.connectionState == "connected":
            client_id = self.connected_cl
            client_ip = 0
            client_status = 0

