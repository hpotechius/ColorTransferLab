"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
import requests
import logging
import time
import signal

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=600, ping_interval=30)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

SS_SID = None

# Example:
# name: Name of the instance: Always has the format Client-<4 digit ID>
# status: Possible values for Client: Idle, Connected (1/2), Connected (2/2)
#   Possible values for ComputeNode: Idle, Busy
# type: Possible values: Client, ComputeNode
# connected_clients: List of IDs of the clients connected to the compute node
# connected_compute_node: ID of the compute node the client/participant is connected to
# connected_participants: List of IDs of the participants connected to the compute node
#
# {
# b9be32a9-35ec-4007-967d-aff3b5d57a11 : {
#     "name": ComputeNode-GTT3,
#     "sid": agaw34aw4gw,
#     "ip_address": 91.169.187.233,
#     "country": Germany,
#     "register_time": 1231222.44324,
#     "type": ComputeNode,
#     "status": "Idle"
#     "connected_clients": ["b9be32a9-35ec-4007-967d-aff3b5d57a11"],
#     "connected_compute_node": "",
#     "connected_participants": ["626250f4-d1f3-450f-89e5-a1sefsefssss"],
#   }
# }

computenode_instances = {}
client_instances = {}
participant_instances = {}

# ANSI-Escape-Sequence for colored output
# ORANGE: General information
# GREEN: Sending messages
# BLUE: Receiving messages
ORANGE = '\033[33m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'

# ------------------------------------------------------------------------------------------------------------------
# Route for the home page
# Render the index.html template and pass the combined dictionary of client and compute node instances
# ------------------------------------------------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", clients={**client_instances, **participant_instances,**computenode_instances})

# ------------------------------------------------------------------------------------------------------------------
# Will be executed when a client connects to the server
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("connect")
def on_connect():
    print(f"{BLUE}[RECV] Client/Server connects...{RESET}")

# ------------------------------------------------------------------------------------------------------------------
# Event handler for client or compute node disconnection
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("disconnect")
def on_disconnect():
    removed_computenode = False

    print(f"{BLUE}[RECV] Client/ComputeNode Disonnected{RESET}")

    # Remove client from clients dictionary
    for client_id, client_data in list(client_instances.items()):
        sid = client_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Disonnect Client: {client_id}{RESET}")
            del client_instances[client_id]

    # Remove participant from participants dictionary
    for participant_id, participant_data in list(participant_instances.items()):
        sid = participant_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Disonnect Participant: {participant_id}{RESET}")
            del participant_instances[participant_id]

    # Remove compute node from compute nodes dictionary
    for computenode_id, computenode_data in list(computenode_instances.items()):
        sid = computenode_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Remove ComputeNode {computenode_id}{RESET}")
            removed_computenode = True
            del computenode_instances[computenode_id]

    # If a compute node was removed, send the updated compute node list to all clients
    if removed_computenode:
        print(f"{GREEN}[SEND] Send updated ComputeNode List to all Clients{RESET}")
        for client_id, client_data in list(client_instances.items()):
            sid = client_data["sid"]
            emit("/getComputeNodesResponse", computenode_instances, to=sid)

    # Update the client list in the web interface
    socketio.emit('update_clients', {**client_instances, **participant_instances, **computenode_instances})

# ------------------------------------------------------------------------------------------------------------------
# Event handler for receiving messages
# Messages which the signal server can process:
# - /getComputeNodesRequest, /getComputeNodesResponse: Client requests list of database servers
# - /putIpAddressRequest: Send IP address to client/participant after registration
# - /putSidRequest: Send SID to client/participant after registration
# - /putStatusRequest: ComputeNode sends status updateregistration
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("message")
def on_message(data):
    from_id = data.get("from")
    target_id = data.get("target")

    print(f"{BLUE}[RECV] Message received from {from_id} to {target_id}{RESET}")

    # Check if the message is intended for the server
    if target_id == "server":
        print(f'{ORANGE}[INFO] Message for Signal Server: {data.get("message")}{RESET}')
        # Client requests list of database servers
        if data.get("message") == "/getComputeNodesRequest":
            emit("/getComputeNodesResponse", computenode_instances, to=request.sid)
        # ComputeNode sends status update
        elif data.get("message") == "/putStatusRequest":
            print(f'{ORANGE}[INFO] Updating Client/Participant and ComputeNode{RESET}')
            # Update Client information in Database Server Information
            if data.get("data")["connected_clients"] != [] or data.get("data")["connected_participants"] != []:
                status = "Connected"
            else:
                status = "Idle"

            # Clear stale client links before applying the current connection list.
            for client in client_instances.values():
                if client["connected_compute_node"] == data.get("from"):
                    client["connected_compute_node"] = ""
                    client["status"] = "Idle"
            for participant in participant_instances.values():
                if participant["connected_compute_node"] == data.get("from"):
                    participant["connected_compute_node"] = ""
                    participant["status"] = "Idle"

            computenode_instances[data.get("from")]["status"] = status
            computenode_instances[data.get("from")]["connected_clients"] = data.get("data")["connected_clients"]
            computenode_instances[data.get("from")]["connected_participants"] = data.get("data")["connected_participants"]

            # If the compute node is connected to a client, update the client's information
            for cl in data.get("data")["connected_clients"]:
                if cl in client_instances:
                    client_instances[cl]["connected_compute_node"] = data.get("from")
                    client_instances[cl]["status"] = "Connected"
            for cl in data.get("data")["connected_participants"]:
                if cl in participant_instances:
                    participant_instances[cl]["connected_compute_node"] = data.get("from")
                    participant_instances[cl]["status"] = "Connected"

            # Emit the updated list of clients and compute nodes to the interface
            socketio.emit('update_clients', {**client_instances, **participant_instances, **computenode_instances})

            # Upate status of ComputeNode and send to all clients
            print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
            for _, client_data in list(client_instances.items()):
                sid = client_data["sid"]
                emit("/getComputeNodesResponse", computenode_instances, to=sid)
        else:
            print("Unknown server", data.get("message"))
        return

    # Check if message is for the ComputeNode
    if target_id in computenode_instances:
        print(f"{ORANGE}[SEND] Forwarding message to Compute Node {target_id}{RESET}")
        sid = computenode_instances[target_id]["sid"]
        emit("message", data, to=sid)
    # Check if message is for a client
    elif target_id in client_instances:
        print(f"{ORANGE}[SEND] Forwarding message to Client {target_id}{RESET}")
        sid = client_instances[target_id]["sid"]
        emit("message", data, to=sid)
    # Check if message is for a participant    
    elif target_id in participant_instances:
        print(f"{ORANGE}[SEND] Forwarding message to Participant {target_id}{RESET}")
        sid = participant_instances[target_id]["sid"]
        emit("message", data, to=sid)
    else:
        print(f"Client {target_id} not found")

# ------------------------------------------------------------------------------------------------------------------
# Function to get the country name from an IP address
# ------------------------------------------------------------------------------------------------------------------
def get_country_from_ip(ip_address):
    if not ip_address:
        return "Unknown"

    # Hugging Face proxies can provide a comma-separated forwarding chain.
    ip_address = ip_address.split(",", 1)[0].strip()
    try:
        response = requests.get(
            f"https://geolocation-db.com/json/{ip_address}",
            params={"position": "true"},
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
        country = data.get("country_name")
        if country:
            return country
    except (requests.RequestException, ValueError) as e:
        print(f"Error fetching country for IP {ip_address}: {e}")

    try:
        response = requests.get(f"https://ipwho.is/{ip_address}", timeout=5)
        response.raise_for_status()
        data = response.json()
        if data.get("success") and data.get("country"):
            return data["country"]
    except (requests.RequestException, ValueError) as e:
        print(f"Fallback country lookup failed for IP {ip_address}: {e}")

    return "Unknown"


def get_registered_country(data, ip_address):
    reported_country = data.get("country")
    if isinstance(reported_country, str) and reported_country.strip():
        return reported_country.strip()
    return get_country_from_ip(ip_address)


# ------------------------------------------------------------------------------------------------------------------
# Registers a connected client
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("register")
def on_register(data):
    SS_SID = request.sid
    client_id = data["client_id"]
    client_remote_ip = request.headers.get("X-Real-IP", request.remote_addr)
    # Get country from IP address
    client_country = get_registered_country(data, client_remote_ip)

    new_dict = {
        "name": data["name"],
        "sid": request.sid,
        "ip_address": client_remote_ip,
        "country": client_country,
        "register_time": time.time(),
        "type": data["type"],
        "status": "Idle",
        "connected_clients": [],
        "connected_compute_node": "",
        "connected_participants": [],
        "privacy": False
    }

    if data["type"] == "Client":
        print(f"{ORANGE}[INFO] Register Client {client_id}{RESET}")
        client_instances[client_id] = new_dict
    if data["type"] == "Participant":
        print(f"{ORANGE}[INFO] Register Participant {client_id}{RESET}")
        participant_instances[client_id] = new_dict
    elif data["type"] == "ComputeNode":
        # Save new database server
        print(f"{ORANGE}[INFO] Register Compute Node {client_id}{RESET}")
        computenode_instances[client_id] = new_dict
        computenode_instances[client_id]["privacy"] = data["privacy"]

        print(f"{GREEN}[SEND] Send updated Compute Node List to all Clients{RESET}")
        for client_id, client_data in list(client_instances.items()):
            sid = client_data["sid"]
            emit("/getComputeNodesResponse", computenode_instances, to=sid)

    # Send Ip Address to Compute Node to same Compute Node 
    print(f"{GREEN}[SEND] Send IP Address {client_remote_ip} to registered Instance with ID {client_id}{RESET}")
    emit("/putIpAddressRequest", client_remote_ip, to=SS_SID)
    emit("/putSidRequest", SS_SID, to=SS_SID)

    socketio.emit('update_clients', {**client_instances, **participant_instances, **computenode_instances})
        
# ------------------------------------------------------------------------------------------------------------------
# Function that is executed when the SIGINT signal is received
# ------------------------------------------------------------------------------------------------------------------
def signal_handler(sig, frame):
    exit(0)

# ------------------------------------------------------------------------------------------------------------------
# Function to check and remove instances with an uptime of 10 minutes or more
# ------------------------------------------------------------------------------------------------------------------
def remove_old_instances():
    while True:
        current_time = time.time()
        ten_minutes = 10 * 60  # 10 minutes in seconds
        sixty_minutes = 60 * 60  # 60 minutes in seconds

        # Check and remove old client instances
        for client_id, client_data in list(client_instances.items()):
            if current_time - client_data["register_time"] >= ten_minutes:
                print(f"{ORANGE}[INFO] Removing old client instance: {client_id}{RESET}")
                del client_instances[client_id]

        # Check and remove old participant instances
        for participant_id, participant_data in list(participant_instances.items()):
            if current_time - participant_data["register_time"] >= sixty_minutes:
                print(f"{ORANGE}[INFO] Removing old participant instance: {participant_id}{RESET}")
                del participant_instances[participant_id]

        # Check and remove old compute node instances
        for computenode_id, computenode_data in list(computenode_instances.items()):
            if current_time - computenode_data["register_time"] >= ten_minutes:
                print(f"{ORANGE}[INFO] Removing old compute node instance: {computenode_id}{RESET}")
                del computenode_instances[computenode_id]

        # Emit the updated list of clients and compute nodes to the interface
        socketio.emit('update_clients', {**client_instances, **participant_instances, **computenode_instances})

        # Sleep for a minute before checking again
        time.sleep(60)

# ------------------------------------------------------------------------------------------------------------------
# Main entry point for the Signal Server
# ------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    # Register the signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    print(f"{ORANGE}[INFO] Starting Signal Server{RESET}")
    socketio.run(app, host="0.0.0.0", port=8071, allow_unsafe_werkzeug=True)