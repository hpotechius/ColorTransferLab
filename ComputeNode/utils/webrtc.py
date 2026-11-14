"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCDataChannel, RTCConfiguration, RTCIceCandidate
import asyncio
import requests
import geocoder
import os
import json
import uuid
from os import path 
import socketio
from PIL import Image as PILImage
import sys
from utils.utils import Utils
import psycopg
from psycopg.rows import dict_row
from .handler_user_study import handlerPutSubmission, handlerGetUserTestSet, handlerPutUserInfo, handlerGetRatingFile
from .handler_admin import handlerGetTestSetResults, handlerGetResultFile, handlerGetIntroductions, handlerPutIntroductions, handlerDeleteResults, handlerDeleteTestSet, handlerPutTestSets, handlerDeleteMetric, handlerPutMetric, handlerPutParticipant, handlerDeleteParticipant, handlerGetUserStudyDatabaseStructure, handlerGetMetrics, handlerGetParticipants, handlerGetTestSets, handlerGetUserStudyFile, handlerGetUserStudyMeta, handlerGetResults
from .handler_signal import handlerIpAddress, handlerDisconnect, handlerMessage
from .handler import handlerGetDatabaseStructure, handlerGetMethods, handlerFileAvailability, handlerSemantics, handlerGetEvaluation, handlerColorTransfer, handlerUploadStart, handlerUploadEnd, handlerFile, handlerPutIpAddress

COMMAND_HANDLERS_TOOL = {
    # GETTER
    "/getDatabaseStructureRequest": handlerGetDatabaseStructure, # Database.jsx
    "/getMethodsRequest": handlerGetMethods, # Algorithms.jsx
    "/getEvaluationRequest": handlerGetEvaluation, # Evaluation.jsx

    # SETTER
    "/putIpAddressRequest": handlerPutIpAddress, # WebRTCProvider.jsx

    "/upload_start": handlerUploadStart, # Database.jsx
    "/upload_end": handlerUploadEnd, # Database.jsx
    "/color_transfer": handlerColorTransfer, # ViewHeader.jsx
    "/file_availability": handlerFileAvailability, # Renderer.jsx
    "/semantics": handlerSemantics, # Semantics.jsx
    "/file": handlerFile,
}

COMMAND_HANDLERS_ADMIN= {
    # GETTER
    "/getIntroductionsRequest": handlerGetIntroductions, # IntroModification.jsx
    "/getTestSetResultsRequest": handlerGetTestSetResults, # TestSetFildeNode.jsx
    "/getUserStudyDatabaseStructureRequest": handlerGetUserStudyDatabaseStructure, # DatabaseUserStudy.jsx
    "/getTestSetsRequest": handlerGetTestSets, # TestSets.jsx
    "/getParticipantsRequest": handlerGetParticipants, # Participants.jsx
    "/getMetricsRequest": handlerGetMetrics, # Metrics.jsx
    "/getResultFileRequest": handlerGetResultFile, # Results.jsx
    "/getUserStudyFileRequest": handlerGetUserStudyFile, # DatabaseUserStudy.jsx
    "/getUserStudyMetaRequest": handlerGetUserStudyMeta,  # DatabaseUserStudy.jsx
    "/getResultsRequest": handlerGetResults,  # TestTypes.jsx

    # SETTER
    "/putIntroductionsRequest": handlerPutIntroductions, # IntroModification.jsx
    "/putTestSetsRequest": handlerPutTestSets, # TestSets.jsx
    "/putParticipantRequest": handlerPutParticipant, # Participants.jsx
    "/putMetricRequest": handlerPutMetric, # Metrics.jsx

    # REMOVAL
    "/deleteTestSetRequest": handlerDeleteTestSet, # TestSetFildeNode.jsx
    "/deleteUserResultsRequest": handlerDeleteResults, # Results.jsx
    "/deleteMetricRequest": handlerDeleteMetric, # Metrics.jsx
    "/deleteParticipantRequest": handlerDeleteParticipant, # Participants.jsx
}

COMMAND_HANDLERS_STUDY = {
    # GETTER
    "/getUserTestSetRequest": handlerGetUserTestSet, # Main.jsx
    "/getRatingFileRequest": handlerGetRatingFile, # TestArea.jsx

    # SETTER
    "/putUserInfoRequest": handlerPutUserInfo, # UserInfo.jsx
    "/putSubmissionRequest": handlerPutSubmission, # TestArea.jsx
}

# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class WebRTCClient:
    def __init__(self, message=None, signal_server=None, client_id=None, window=None, compute_node_name=None, compute_node_privacy=None):
        self.sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=0, ssl_verify=False, request_timeout=600)
        self.connection_event = asyncio.Event()
        self.message = ""
        # Keep binary DataChannel messages below the SCTP peer limit.
        self.chunk_size = 64 * 1024
        self.signal_server = signal_server
        self.client_id = client_id
        self.window = window
        self.compute_node_name = compute_node_name
        self.compute_node_privacy = compute_node_privacy
        self.compute_node_ip_address = None
        self.received_arraybuffer = []
        self.received_file_name = ""
        # Multi-Client: {client_id: {"pc": ..., "channel": ...}}
        self.connections = {}

        

    # ------------------------------------------------------------------------------------------------------------------
    # Creates a new RTCPeerConnection for a given client ID and sets up event handlers for ICE candidates, 
    # data channels, and connection state changes.
    # ------------------------------------------------------------------------------------------------------------------
    def create_peer_connection(self, client_id, client_type="Client"):
        ice_servers = [
            RTCIceServer(urls="stun:stun.l.google.com:19302"),
            RTCIceServer(urls="stun:stun1.l.google.com:19302"),
            RTCIceServer(
                urls=self.window.turn_name,
                username=self.window.turn_user,
                credential=self.window.turn_pw
            ),
        ]
        
        pc = RTCPeerConnection(RTCConfiguration(iceServers=ice_servers))
        self.connections[client_id] = {"pc": pc, "channel": None, "type": client_type}
        pc.on("icecandidate", lambda candidate: asyncio.create_task(self.on_icecandidate(candidate, client_id)))
        pc.on("datachannel", lambda channel: self.on_datachannel(channel, client_id))
        pc.on("iceconnectionstatechange", lambda: self.on_iceconnectionstatechange(client_id))
        pc.on("connectionstatechange", lambda: self.on_connectionstatechange(client_id))
        return pc

    # ------------------------------------------------------------------------------------------------------------------
    # Connects to the signal server and registers the compute node.
    # ------------------------------------------------------------------------------------------------------------------
    async def connect_to_signal_server(self):
        Utils.printSEND(f"Connect to Signal Server {self.signal_server}", self.window)

        ip_adress = requests.get('https://api.ipify.org?format=json').json()['ip']
        country = geocoder.ip(ip_adress).country

        @self.sio.on("message")
        async def handle_message(data):
            await handlerMessage(self, data)

        @self.sio.on("/putIpAddressRequest")
        async def _handle_ip_address(data):
            await handlerIpAddress(self, data)

        @self.sio.event
        async def disconnect():
            await handlerDisconnect(self)

        @self.sio.event
        async def connect():
            await self.sio.emit(
                "register",
                {
                    "name": self.compute_node_name,
                    "type": "ComputeNode",
                    "client_id": self.client_id,
                    "country": country,
                    "privacy": self.compute_node_privacy
                }
            )
            Utils.printINFO(
                f"Connected to Signal Server as {self.client_id}",
                self.window,
            )

        await self.sio.connect(self.signal_server)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def send_message(self, data):
        await self.sio.emit("message", data)

    async def on_relay_request(self, client_id, password, test_link=None):
        if test_link is not None:
            Utils.printWARN(
                "WebSocket fallback is unavailable for user-study links.",
                self.window,
            )
            return
        if self.window.compute_node_privacy and (
            password != self.window.compute_node_privacy_pw
        ):
            Utils.printWARN(f"Wrong password for WebSocket relay from {client_id}.", self.window)
            await self.send_message({
                "type": "error",
                "reason": "invalid password",
                "target": client_id,
                "from": self.client_id,
            })
            return

        old_connection = self.connections.pop(client_id, None)
        if old_connection and old_connection.get("pc"):
            await old_connection["pc"].close()
        self.connections[client_id] = {
            "pc": None,
            "channel": None,
            "type": "Client",
            "transport": "relay",
        }
        self.connection_event.set()
        self.window.set_compute_node_status("Connected")
        client_keys = [
            key for key, value in self.connections.items()
            if isinstance(value, dict) and value.get("type") == "Client"
        ]
        participant_keys = [
            key for key, value in self.connections.items()
            if isinstance(value, dict) and value.get("type") == "Participant"
        ]
        await self.send_message({
            "target": "server",
            "from": self.client_id,
            "message": "/putStatusRequest",
            "data": {
                "status": "Busy",
                "connected_clients": client_keys,
                "connected_participants": participant_keys,
            },
        })
        await self.send_message({
            "type": "relay_ready",
            "target": client_id,
            "from": self.client_id,
        })
        Utils.printINFO(f"WebSocket relay connected for {client_id}.", self.window)

    async def on_relay_message(self, client_id, message):
        connection = self.connections.get(client_id)
        if not connection or connection.get("transport") != "relay":
            return
        if isinstance(message, bytes):
            message = message.decode("utf-8")
        elif isinstance(message, dict):
            message = json.dumps(message)
        await self.on_message(message, client_id)

    async def on_relay_close(self, client_id):
        connection = self.connections.pop(client_id, None)
        if connection and connection.get("pc"):
            await connection["pc"].close()
        self._remove_client_from_interface(client_id)
        if not self.connections:
            self.connection_event.clear()
            self.window.set_compute_node_status("Idle")
        client_keys = [
            key for key, value in self.connections.items()
            if isinstance(value, dict) and value.get("type") == "Client"
        ]
        participant_keys = [
            key for key, value in self.connections.items()
            if isinstance(value, dict) and value.get("type") == "Participant"
        ]
        await self.send_message({
            "target": "server",
            "from": self.client_id,
            "message": "/putStatusRequest",
            "data": {
                "status": "Busy",
                "connected_clients": client_keys,
                "connected_participants": participant_keys,
            },
        })
        Utils.printINFO(f"WebSocket relay disconnected for {client_id}.", self.window)

    def _remove_client_from_interface(self, client_id):
        for key, value in list(self.window.connections_data.items()):
            if isinstance(value, dict) and value.get("id") == client_id:
                del self.window.connections_data[key]
                self.window.set_client_box()
                return

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_offer(self, sdp, from_client, password, test_link=None):
        Utils.printINFO(f"Setting up connection for {from_client} (resetting old PeerConnection if any)...", self.window)

        # Remove existing connection if exists and create a new one
        if from_client in self.connections:
            try:
                await self.connections[from_client]["pc"].close()
            except Exception:
                pass
            if from_client in self.connections:
                del self.connections[from_client]

        if test_link is not None:
            client_type = "Participant"
        else:
            client_type = "Client"

        pc = self.create_peer_connection(from_client, client_type)

        offer = RTCSessionDescription(sdp, "offer")
        await pc.setRemoteDescription(offer)

        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        Utils.printSEND(f"Sending answer to target {from_client}", self.window)

        result = None
        valid = False
        if test_link is not None:
            # User-study links are validated against the optional PostgreSQL database.
            try:
                conn = psycopg.connect(
                    "dbname=userstudy user=postgres password=postgres "
                    "host=localhost port=5432"
                )
                with conn.cursor(row_factory=dict_row) as cur:
                    cur.execute(
                        "SELECT * FROM participant WHERE test_link = %s;",
                        (test_link,),
                    )
                    result = cur.fetchone()
                    valid = result is not None and result["valid"]
                conn.close()
            except psycopg.OperationalError as error:
                Utils.printINFO(
                    f"User-study database unavailable: {error}",
                    self.window,
                )

        # Check if Password is correct
        if (test_link is None and (password == self.window.compute_node_privacy_pw or self.window.compute_node_privacy == False)):
            Utils.printINFO(f"Correct password", self.window)
            await self.send_message({
                "type": "answer",
                "sdp": pc.localDescription.sdp,
                "target": from_client,
                "from": self.client_id,
            })
        # If a test link is provided, also check if it is correct and valid, if so accept the connection, otherwise reject it.
        elif (test_link is not None and result is not None and valid == True):
            # also check if the participant is already marked as invalid, if so reject the connection
            Utils.printINFO(f"Correct test link", self.window)
            await self.send_message({
                "type": "answer",
                "sdp": pc.localDescription.sdp,
                "target": from_client,
                "from": self.client_id,
            })
        else:
            Utils.printINFO(f"Wrong password", self.window)
            await self.send_message({
                "type": "error",
                "reason": "Wrong password!",
                "target": from_client,
                "from": self.client_id,
            })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_icecandidate(self, candidate, client_id):
        Utils.printINFO(f"ICE candidate for {client_id} received", self.window)

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
                "target": client_id,
                "from": self.client_id,
            })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_candidate(self, candidate_data, from_client):
        Utils.printINFO(f"Add ICE candidate for {from_client}", self.window)
        Utils.printRECV(f"ICE candidate: {candidate_data['candidate']}", self.window)

        if from_client not in self.connections:
            Utils.printINFO(f"No connection for {from_client}", self.window)
            return

        if not candidate_data["candidate"]:
            Utils.printINFO(f"No ICE candidate provided.", self.window)
            self.connection_event.clear()
            return

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

        pc = self.connections[from_client]["pc"]
        await pc.addIceCandidate(candidate)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_datachannel(self, channel: RTCDataChannel, client_id):
        Utils.printINFO(f"DataChannel created for {client_id}.", self.window)
        self.connections[client_id]["channel"] = channel
        channel.on("open", lambda: self.on_channel_open(client_id))
        channel.on("message", lambda message: asyncio.create_task(self.on_message(message, client_id)))

        client_keys = [k for k, v in self.connections.items() if isinstance(v, dict) and v.get("type") == "Client"]
        participant_keys = [k for k, v in self.connections.items() if isinstance(v, dict) and v.get("type") == "Participant"]

        await self.send_message({
            "target": "server",
            "from": self.client_id,
            "message": "/putStatusRequest",
            "data": {
                "status": "Busy",
                "connected_clients": client_keys,
                "connected_participants": participant_keys
            }
        })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_channel_open(self, client_id):
        print(f"DataChannel for {client_id} is now open!")
        self.send_datachannel_message("XXX", client_id)

    # ------------------------------------------------------------------------------------------------------------------
    # Divides the file into chunks and sends them
    # ------------------------------------------------------------------------------------------------------------------
    async def sendFileChunks(self, filepath, ext, container_size, client_id):
        self.send_datachannel_message({"message": "fileTransferStart", "data": ext}, client_id)

        bytes_sent = 0
        is_tty = sys.stdout.isatty()

        def print_progress():
            if container_size <= 0 or not is_tty:
                return
            percent = (bytes_sent / container_size) * 100.0
            bar_len = 30
            filled_len = int(bar_len * percent / 100.0)
            bar = "#" * filled_len + "-" * (bar_len - filled_len)
            sys.stdout.write(
                f"\rSending {ext} [{bar}] {percent:5.1f}% "
                f"({bytes_sent}/{container_size} bytes)"
            )
            sys.stdout.flush()

        with open(filepath, "rb") as file:
            while True:
                chunk = file.read(self.chunk_size)
                if not chunk:
                    break

                self.send_datachannel_message(chunk, client_id, isBytes=True)
                bytes_sent += len(chunk)

                print_progress()
                await asyncio.sleep(0.01)

        if container_size > 0 and is_tty:
            sys.stdout.write("\n")
            sys.stdout.flush()

        self.send_datachannel_message({"message": "fileTransferEnd", "data": ""}, client_id)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def get_container_size(self, filepath, container_type):
        file_size = os.path.getsize(filepath)
        return file_size
    
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def sendFiles(self, data_recv, container_type, client_id):
        abs_path = data_recv["abstractPath"]

        if data_recv["mode"] == "semantics":
            filepath = path.join("files/semantics", abs_path)
        elif data_recv["mode"] == "userstudy" or data_recv["mode"] == "usertest" or data_recv["mode"] == "result":
            filepath = path.join("files/study", abs_path)
        else:
            filepath = path.join("files/data", abs_path)

        container_size = self.get_container_size(filepath, container_type)

        self.send_datachannel_message({
            "message": "containerTransferStart",
            "data" : {
                "rid": data_recv["rid"],
                "type": container_type,
                "mode": data_recv["mode"],
                "abstractPath": data_recv["abstractPath"],
                "size": container_size
            }
        }, client_id)

        Utils.printSEND(f"Sending {container_type} Data.", self.window)
        if container_type == "Image":
            await self.sendFileChunks(filepath, "png", container_size, client_id)
        elif container_type == "Video":
            await self.sendFileChunks(filepath, "mp4", container_size, client_id)
        elif container_type == "PointCloud":
            await self.sendFileChunks(filepath, "ply", container_size, client_id)
        elif container_type == "GaussianSplatting":
            await self.sendFileChunks(filepath, "splat", container_size, client_id)
        elif container_type == "LightField":
            await self.sendFileChunks(filepath, "lfd", container_size, client_id)
        elif container_type == "Mesh" or container_type == "VolumetricVideo":
            await self.sendFileChunks(filepath, "mesh", container_size, client_id)

        self.send_datachannel_message({
            "message": "containerTransferEnd",
            "data" : ""
        }, client_id)

    # ------------------------------------------------------------------------------------------------------------------
    # Creates a reference image for the color theme based on the provided colors and saves it to the specified path.
    # ------------------------------------------------------------------------------------------------------------------
    def createRefColorThemeImage(self, colors, ref_path):
        width, height = 256, 256
        num_colors = len(colors)
        stripe_width = width // num_colors
        image = PILImage.new("RGB", (width, height))
        pixels = image.load()

        # Draw vertical stripes of the specified colors across the image
        for i, color in enumerate(colors):
            color = color.lstrip('#')
            rgb = tuple(int(color[j:j+2], 16) for j in (0, 2, 4))
            for x in range(i * stripe_width, (i + 1) * stripe_width):
                for y in range(height):
                    pixels[x, y] = rgb

        # This ensures that the entire image is filled, even if the number of colors does not perfectly divide the width.
        for x in range(num_colors * stripe_width, width):
            for y in range(height):
                pixels[x, y] = rgb

        image.save(ref_path)

    # ------------------------------------------------------------------------------------------------------------------
    # Message handler for incoming messages from the Web Client
    # ------------------------------------------------------------------------------------------------------------------
    async def on_message(self, message, client_id):
        if isinstance(message, bytes):
            Utils.printINFO("Received a message of type bytes.", self.window)
            self.received_arraybuffer.append(message)
        else:
            data_recv_string = json.loads(message)
            command_recv = data_recv_string["command"]

            COMMAND_HANDLERS_TOTAL = {**COMMAND_HANDLERS_TOOL, **COMMAND_HANDLERS_ADMIN, **COMMAND_HANDLERS_STUDY}
            handler = COMMAND_HANDLERS_TOTAL.get(command_recv)
            if handler:
                await handler(self, message, client_id)
            else:
                Utils.printRECV(f"Invalid received message.", self.window)

    # ------------------------------------------------------------------------------------------------------------------
    # Send a message to the Web Client via the DataChannel. If isBytes is True, the message is sent as bytes, 
    # otherwise it is sent as a JSON string.
    # ------------------------------------------------------------------------------------------------------------------
    def send_datachannel_message(self, message, client_id, isBytes=False):
        channel = self.connections.get(client_id, {}).get("channel")
        if channel and channel.readyState == "open":
            if isBytes:
                channel.send(message)
            else:
                channel.send(json.dumps(message))
        elif self.connections.get(client_id, {}).get("transport") == "relay":
            payload = message if isBytes else json.dumps(message)
            if isinstance(payload, str) and len(payload) > 48 * 1024:
                chunk_size = 48 * 1024
                chunks = [
                    payload[offset:offset + chunk_size]
                    for offset in range(0, len(payload), chunk_size)
                ]
                transfer_id = str(uuid.uuid4())
                for index, chunk in enumerate(chunks):
                    asyncio.create_task(self.send_message({
                        "type": "relay_chunk",
                        "target": client_id,
                        "from": self.client_id,
                        "transfer_id": transfer_id,
                        "index": index,
                        "total": len(chunks),
                        "data": chunk,
                    }))
            else:
                asyncio.create_task(self.send_message({
                    "type": "relay_data",
                    "target": client_id,
                    "from": self.client_id,
                    "data": payload,
                }))
        else:
            Utils.printINFO(f"DataChannel for {client_id} is not open yet. Cannot send message.", self.window)

    # ------------------------------------------------------------------------------------------------------------------
    # Handle changes to the ICE connection state
    # ------------------------------------------------------------------------------------------------------------------
    def on_iceconnectionstatechange(self, client_id):
        pc = self.connections.get(client_id, {}).get("pc")
        if pc:
            Utils.printINFO(f"ICE connection state for {client_id}: {pc.iceConnectionState}.", self.window)

    # ------------------------------------------------------------------------------------------------------------------
    # Handle changes to the connection state
    # ------------------------------------------------------------------------------------------------------------------
    async def on_connectionstatechange(self, client_id):
        pc = self.connections.get(client_id, {}).get("pc")
        if not pc:
            return
        state = pc.connectionState
        Utils.printINFO(f"Connection state for {client_id}: {state}.", self.window)

        if state == "connected":
            self.connection_event.set()
        elif state in ("disconnected", "failed", "closed"):
            print(f"Connection with {client_id} lost. Cleaning up...")

            # Remove the connection data
            self._remove_client_from_interface(client_id)

            if client_id in self.connections:
                del self.connections[client_id]

                client_keys = [k for k, v in self.connections.items() if isinstance(v, dict) and v.get("type") == "Client"]
                participant_keys = [k for k, v in self.connections.items() if isinstance(v, dict) and v.get("type") == "Participant"]
                
                await self.send_message({
                    "target": "server",
                    "from": self.client_id,
                    "message": "/putStatusRequest",
                    "data": {
                        "status": "Busy",
                        "connected_clients": client_keys,
                        "connected_participants": participant_keys
                    }
                })
            self.connection_event.clear()