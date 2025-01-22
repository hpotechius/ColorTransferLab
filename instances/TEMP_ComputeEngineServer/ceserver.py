import asyncio
import uuid
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCDataChannel, RTCIceCandidate
import socketio
import argparse
import re
import requests
import geocoder

# Kommandozeilenargumente parsen
parser = argparse.ArgumentParser(description="WebRTC Client")
parser.add_argument("--input", type=str, help="The message to send automatically")
args = parser.parse_args()

SIGNAL_SERVER = "http://localhost:8080"
CLIENT_ID = "56309aa6-4414-4ad5-9bb7-9e7c83eba142"#str(uuid.uuid4())

sio = socketio.AsyncClient()


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class WebRTCClient:
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init__(self, message=None):
        self.connection_event = asyncio.Event()
        self.message = "X"#message  # Nachricht aus --input
        self.reset_peer_connection()

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def reset_peer_connection(self):
        self.pc = RTCPeerConnection()
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

        await sio.connect(SIGNAL_SERVER)
        await sio.emit("register", 
                       {
                            "name": "ABC",
                            "type": "Compute Engine",
                            "client_id": CLIENT_ID,
                            "ip_adress": ip_adress,
                            "country": country
                        })
        print(f"Connected to Signal Server as {CLIENT_ID}")

        @sio.on("message")
        async def handle_message(data):
            print(f"Received message from server: {data}")
            if data["type"] == "offer":
                print("Processing offer...")
                await self.on_offer(data["sdp"], data["from"])
                self.connection_event.set()
            elif data["type"] == "answer":
                print("Processing answer...")
                await self.on_answer(data["sdp"])
                self.connection_event.set()
            elif data["type"] == "candidate":
                print("Processing candidate...")
                await self.on_candidate(data["candidate"])

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def send_message(self, data):
        await sio.emit("message", data)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def create_offer(self, target):
        print("Creating offer...")
        self.channel = self.pc.createDataChannel("chat")
        self.channel.on("open", self.on_channel_open)
        self.channel.on("message", lambda message: asyncio.create_task(self.on_message(message)))

        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)

        print("Offer created, sending to target...")
        await self.send_message({
            "type": "offer",
            "sdp": self.pc.localDescription.sdp,
            "target": target,
            "from": CLIENT_ID,
        })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_offer(self, sdp, from_client):
        print("Offer received. Setting up connection...")
        offer = RTCSessionDescription(sdp, "offer")
        await self.pc.setRemoteDescription(offer)

        answer = await self.pc.createAnswer()
        await self.pc.setLocalDescription(answer)

        print("Sending answer to target...")
        await self.send_message({
            "type": "answer",
            "sdp": self.pc.localDescription.sdp,
            "target": from_client,
            "from": CLIENT_ID,
        })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_answer(self, sdp):
        print("Answer received. Completing connection...")
        answer = RTCSessionDescription(sdp, "answer")
        await self.pc.setRemoteDescription(answer)

    # async def on_icecandidate(self, candidate):
    #     if candidate:
    #         print(f"Sending ICE candidate: {candidate}")
    #         await self.send_message({
    #             "type": "candidate",
    #             "candidate": candidate.to_dict(),
    #             "target": target,
    #             "from": CLIENT_ID,
    #         })

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_icecandidate(self, candidate):
        if candidate:
            print(f"Sending ICE candidate: {candidate}")
            await self.send_message({
                "type": "candidate",
                "candidate": {
                    "candidate": candidate.candidate,
                    "sdpMid": candidate.sdpMid,
                    "sdpMLineIndex": candidate.sdpMLineIndex,
                    "usernameFragment": candidate.usernameFragment
                },
                "target": target,
                "from": CLIENT_ID,
            })



    # async def on_candidate(self, candidate):
    #     print(f"Processing candidate: {candidate}")
    #     await self.pc.addIceCandidate(candidate)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_candidate(self, candidate_data):

        def parse_candidate(candidate_str):
            candidate_pattern = re.compile(
                r"candidate:(?P<foundation>\d+) (?P<component>\d) (?P<protocol>\w+) (?P<priority>\d+) "
                r"(?P<ip>[\d\.:a-fA-F]+) (?P<port>\d+) typ (?P<type>\w+)(?: raddr (?P<raddr>[\d\.:a-fA-F]+))?(?: rport (?P<rport>\d+))?"
                r"(?: generation (?P<generation>\d+))?(?: ufrag (?P<ufrag>\w+))?(?: network-cost (?P<network_cost>\d+))?"
            )
            match = candidate_pattern.match(candidate_str)
            if not match:
                raise ValueError("Invalid ICE candidate string")
            return match.groupdict()

        print(f"Processing candidate: {candidate_data}")
        parsed_candidate = parse_candidate(candidate_data["candidate"])
        candidate = RTCIceCandidate(
            component=int(parsed_candidate["component"]),
            foundation=parsed_candidate["foundation"],
            ip=parsed_candidate["ip"],
            port=int(parsed_candidate["port"]),
            priority=int(parsed_candidate["priority"]),
            protocol=parsed_candidate["protocol"],
            type=parsed_candidate["type"],
            sdpMid=candidate_data["sdpMid"],
            sdpMLineIndex=candidate_data["sdpMLineIndex"],
            #candidate=candidate_data["candidate"]
        )
        await self.pc.addIceCandidate(candidate)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_datachannel(self, channel: RTCDataChannel):
        print("DataChannel created on wait side.")
        self.channel = channel
        self.channel.on("open", self.on_channel_open)
        self.channel.on("message", lambda message: asyncio.create_task(self.on_message(message)))

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_channel_open(self):
        print("DataChannel is now open!")
        if self.message:
            print(f"Sending input message: {self.message}")
            self.send_datachannel_message(self.message)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    async def on_message(self, message):
        print(f"Message received: {message}")

        #await asyncio.sleep(1)

        # Automatisch antworten
        #response = f"X-{message}"
        #print(f"Sending automatic reply: {response}")
        #self.send_datachannel_message(response)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def send_datachannel_message(self, message):
        if self.channel and self.channel.readyState == "open":
            print(f"Sending message: {message}")
            self.channel.send(message)
        else:
            print("DataChannel is not open yet.")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_iceconnectionstatechange(self):
        print(f"ICE connection state: {self.pc.iceConnectionState}")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def on_connectionstatechange(self):
        print(f"Connection state: {self.pc.connectionState}")
        if self.pc.connectionState == "closed":
            self.connection_event.clear()
            self.reset_peer_connection()

# ----------------------------------------------------------------------------------------------------------------------
# 
# ----------------------------------------------------------------------------------------------------------------------
async def main():
    client = WebRTCClient(message=args.input)
    await client.connect_to_signal_server()

    while True:
        # mode = input("Type 'offer' to start or 'wait' to wait: ")
        # if mode.lower() == "offer":
        #     target = input("Enter target client ID: ")
        #     await client.create_offer(target)
        #     print("Waiting for connection to establish...")
        # else:
        #     print("Waiting for incoming connection...")

        # Automatically goes into wait mode
        print("Waiting for incoming connection...")

        # Nicht-blockierende Schleife, um auf Verbindung zu warten
        while not client.connection_event.is_set():
            await asyncio.sleep(0.1)

        print("Connection established!")

        # Warte, bis die Verbindung unterbrochen wird
        while client.connection_event.is_set():
            await asyncio.sleep(0.1)

        print("Connection lost. Waiting to reconnect...")

# async def main():
#     client = WebRTCClient(message=args.input)
#     await client.connect_to_signal_server()

#     mode = input("Type 'offer' to start or 'wait' to wait: ")
#     if mode.lower() == "offer":
#         target = input("Enter target client ID: ")
#         await client.create_offer(target)
#         print("Waiting for connection to establish...")
#     else:
#         print("Waiting for incoming connection...")

#     # Nicht-blockierende Schleife, um auf Verbindung zu warten
#     while not client.connection_event.is_set():
#         await asyncio.sleep(0.1)

#     print("Connection established!")

#     await sio.wait()

# ----------------------------------------------------------------------------------------------------------------------
# 
# ----------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    asyncio.run(main())
