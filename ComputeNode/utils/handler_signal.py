"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

from utils.utils import Utils

# ------------------------------------------------------------------------------------------------------------------
#  Handlers for incoming messages from the Signal Server.
# ------------------------------------------------------------------------------------------------------------------
async def handlerMessage(webrtcclient,data):
    msg_type = data.get("type")
    sender = data.get("from")
    if msg_type == "offer":
        Utils.printRECV(f"Received Offer from {sender}", webrtcclient.window)
        await webrtcclient.on_offer(data["sdp"], sender, data.get("password"), data.get("test_link"))
    elif msg_type == "relay_request":
        Utils.printRECV(f"Received WebSocket relay request from {sender}", webrtcclient.window)
        await webrtcclient.on_relay_request(
            sender, data.get("password"), data.get("test_link")
        )
    elif msg_type == "relay_data":
        await webrtcclient.on_relay_message(sender, data.get("data"))
    elif msg_type == "relay_close":
        await webrtcclient.on_relay_close(sender)
    elif msg_type == "answer":
        print("Processing answer...")
        await webrtcclient.on_answer(data["sdp"], sender)
    elif msg_type == "candidate":
        Utils.printRECV(f"Processing candidate...", webrtcclient.window)
        await webrtcclient.on_candidate(data["candidate"], sender)
    else:
        Utils.printRECV(f"Received unknown message type", webrtcclient.window)

# ------------------------------------------------------------------------------------------------------------------
# Handler for receiving the Compute Node's public IP address from the Signal Server.
# ------------------------------------------------------------------------------------------------------------------
async def handlerIpAddress(webrtcclient, data):
    Utils.printRECV(f"Received Message from Signal Server: Compute Node IP Address: {data}", webrtcclient.window)
    webrtcclient.window.set_compute_node_ip_address(data)
    webrtcclient.compute_node_ip_address = data

# ------------------------------------------------------------------------------------------------------------------
# Handler for disconnection events from the Signal Server.
# ------------------------------------------------------------------------------------------------------------------
async def handlerDisconnect(webrtcclient):
    Utils.printINFO("Disconnected from Signal Server", webrtcclient.window)
    # Mark signal server as offline and clear connection state;
    # reconnection is handled by socket.io's built-in logic.
    webrtcclient.connection_event.clear()
    try:
        webrtcclient.window.set_signal_server_status("Offline")
    except Exception:
        pass

    # Reset peer connection to clear old ICE candidates and states, so that we start fresh on reconnection
    webrtcclient.reset_peer_connection()
    