from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
import requests
import logging
import time
import sqlite3
import signal
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=600, ping_interval=30)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

SS_SID = None
sql_conn = None
CONN = None

# Example:
# name:            Name of the instance: Always has the format Client-<4 digit ID>
# status:          Possible values for Client: Idle, Connected (1/2), Connected (2/2)
#                  Possible values for ComputeNode: Idle, Busy
# type:            Possible values: Client, ComputeNode
# connected_to_db: ID of the database server the client is connected to
# connected_to_ce: ID of the compute engine the client is connected to
#
# {
# b9be32a9-35ec-4007-967d-aff3b5d57a11 : {
#     "name": Client-GTT3,
#     "sid": agaw34aw4gw,
#     "ip_address": 91.169.187.233,
#     "country": Germany,
#     "register_time": 1231222.44324,
#     "type": Client,
#     "status": "Idle"
#     "connected_to_cl": "b9be32a9-35ec-4007-967d-aff3b5d57a11",
#     "connected_to_db": "626250f4-d1f3-450f-89e5-a11534502213",
#     "connected_to_ce": "626250f4-d1f3-450f-89e5-a1sefsefssss",
#   }
# }

computenode_instances = {}
client_instances = {}

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
# ------------------------------------------------------------------------------------------------------------------
@app.route("/")
def index():
    # Render the index.html template and pass the combined dictionary of client and compute node instances
    return render_template("index.html", clients={**client_instances, **computenode_instances})

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
            break

    # Remove compute node from compute nodes dictionary
    for computenode_id, computenode_data in list(computenode_instances.items()):
        sid = computenode_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Remove ComputeNode {computenode_id}{RESET}")
            removed_computenode = True
            del computenode_instances[computenode_id]
            break

    # If a compute node was removed, send the updated compute node list to all clients
    if removed_computenode:
        print(f"{GREEN}[SEND] Send updated ComputeNode List to all Clients{RESET}")
        for client_id, client_data in list(client_instances.items()):
            sid = client_data["sid"]
            emit("db_request", computenode_instances, to=sid)

    # Update the client list in the web interface
    socketio.emit('update_clients', {**client_instances, **computenode_instances})

# ------------------------------------------------------------------------------------------------------------------
# Event handler for receiving messages
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
        if data.get("message") == "/database":
            emit("db_request", computenode_instances, to=request.sid)
        # Signaling server sends feedback
        elif data.get("message") == "feedback":
            print(f'{GREEN}[SEND] Send Feedback with title: {data.get("data")["category"]}{RESET}')
            subject = "Feedback: " + data.get("data")["category"]
            body = data.get("data")["message"]
            smtp_port = 587

            to_email = "123"
            from_email = "123"
            smtp_server = "123"
            smtp_user = "123"
            smtp_password = "123"


            # Send the feedback email
            send_email(subject, body, to_email, from_email, smtp_server, smtp_port, smtp_user, smtp_password)
        # ComputeNode sends status update
        elif data.get("message") == "update_status":
            print(f'{ORANGE}[INFO] Updating Client and ComputeNode{RESET}')
            # Update Client information in Database Server Information
            computenode_instances[data.get("from")]["status"] = data.get("data")["status"]
            computenode_instances[data.get("from")]["connected_cl"] = data.get("data")["connected_cl"]

            # If the database is connected to a client, update the client's information
            if(data.get("data")["connected_cl"] != ""):
                client_instances[data.get("data")["connected_cl"]]["connected_db"] = data.get("from")
                client_instances[data.get("data")["connected_cl"]]["status"] = "Connected"

            # Emit the updated list of clients and compute nodes to the interface
            socketio.emit('update_clients', {**client_instances, **computenode_instances})

            # Upate status of ComputeNode and send to all clients
            print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
            for _, client_data in list(client_instances.items()):
                sid = client_data["sid"]
                emit("db_request", computenode_instances, to=sid)
        else:
            print("Unknown server", data.get("message"))
        return

    # Check if message is for the ComputeNode
    if target_id in computenode_instances:
        print(f"{ORANGE}[SEND] Forwarding message to Database Server {target_id}{RESET}")

        # check privacy setting of compute node. If privacy is enabled, only forward messages from the same IP
        if computenode_instances[target_id]["privacy"] and computenode_instances[target_id]["ip_address"] != request.remote_addr:
            print(f"{ORANGE}[INFO] Privacy enabled. Message not forwarded{RESET}")
            return

        sid = computenode_instances[target_id]["sid"]
        emit("message", data, to=sid)
    # Check if message is for a client
    elif target_id in client_instances:
        print(f"{ORANGE}[SEND] Forwarding message to Client {target_id}{RESET}")
        sid = client_instances[target_id]["sid"]
        emit("message", data, to=sid)
    else:
        print(f"Client {target_id} not found")

# ------------------------------------------------------------------------------------------------------------------
# Function to get the country name from an IP address
# ------------------------------------------------------------------------------------------------------------------
def get_country_from_ip(ip_address):
    try:
        # Send a request to the geolocation API with the given IP address
        response = requests.get(f'https://geolocation-db.com/json/{ip_address}&position=true')
        # Parse the JSON response
        data = response.json()
        # Return the country name from the response data, or 'Unknown' if not found
        return data.get('country_name', 'Unknown')
    except requests.RequestException as e:
        # Print an error message if the request fails
        print(f"Error fetching country for IP {ip_address}: {e}")
        # Return 'Unknown' if there is an exception
        return 'Unknown'

# ------------------------------------------------------------------------------------------------------------------
# Registers a connected client
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("register")
def on_register(data):
    SS_SID = request.sid
    client_id = data["client_id"]
    client_remote_ip = request.headers.get("X-Real-IP", request.remote_addr)
    client_country = get_country_from_ip(client_remote_ip)  # Land aus der IP-Adresse ermitteln

    new_dict = {
        "name": data["name"],
        "sid": request.sid,
        "ip_address": client_remote_ip,
        "country": client_country,
        "register_time": time.time(),
        "type": data["type"],
        "status": "Idle",
        "connected_cl": "",
        "connected_db": "",
        "privacy": False
    }

    if data["type"] == "Client":
        print(f"{ORANGE}[INFO] Register Client {client_id}{RESET}")
        client_instances[client_id] = new_dict
    elif data["type"] == "ComputeNode":
        # Save new database server
        print(f"{ORANGE}[INFO] Register Compute Node {client_id}{RESET}")
        computenode_instances[client_id] = new_dict
        computenode_instances[client_id]["privacy"] = data["privacy"]

        print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
        for client_id, client_data in list(client_instances.items()):
            sid = client_data["sid"]
            emit("db_request", computenode_instances, to=sid)

    
    # Send Ip Address to Compute Node to same Compute Node 
    print(f"{GREEN}[SEND] Send IP Address {client_remote_ip} to registered Instance with ID {client_id}{RESET}")
    emit("/ip_address", client_remote_ip, to=SS_SID)

    emit("sid", SS_SID, to=SS_SID)

    socketio.emit('update_clients', {**client_instances, **computenode_instances})
        
# ------------------------------------------------------------------------------------------------------------------
# Function that is executed when the SIGINT signal is received
# ------------------------------------------------------------------------------------------------------------------
def signal_handler(sig, frame):
    def print_database():
        # Connect to the SQLite database
        CONN = sqlite3.connect('connections.db')
        sql_conn = CONN.cursor()
        # Execute a query to select all rows from the 'users' table
        sql_conn.execute("SELECT * FROM users")
        rows = sql_conn.fetchall()
         # Print each row in the 'users' table
        for row in rows:
            print(row)
        # Close the database connection
        CONN.close()
    print("SIGINT empfangen. Programm wird beendet. Datenbankinhalt:")
    print_database()
    # Close the database connection
    CONN.close()
    exit(0)

# ------------------------------------------------------------------------------------------------------------------
# Function to send an email
# ------------------------------------------------------------------------------------------------------------------
def send_email(subject, body, to_email, from_email, smtp_server, smtp_port, smtp_user, smtp_password):
    # Create the MIME Multipart object
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    # Attach the body text to the message
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to the SMTP server and send the email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls() # Use TLS for security
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()

        print(f'{ORANGE}[INFO] Mail was sent sucessfully to {to_email} from {from_email}{RESET}')
    except Exception as e:
        print(f"Error sending email: {e}")

# ------------------------------------------------------------------------------------------------------------------
# Main entry point for the Signal Server
# ------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    # Register the signal handler
    signal.signal(signal.SIGINT, signal_handler)

    # Connect to the SQLite database (creates the database if it does not exist)
    # stores the connections of the clients and compute nodes
    CONN = sqlite3.connect('connections.db')
    sql_conn = CONN.cursor()

    # Create a table
    sql_conn.execute('''CREATE TABLE IF NOT EXISTS users
                        (id TEXT PRIMARY KEY, 
                        name TEXT, 
                        ip TEXT,
                        country TEXT,
                        type TEXT,
                        starttime REAL)''')
    CONN.commit()
    CONN.close()
    
    print(f"{ORANGE}[INFO] Starting Signal Server{RESET}")
    socketio.run(app, host="0.0.0.0", port=8071, allow_unsafe_werkzeug=True)

    # Uncomment the following lines to run the server with SSL
    # ca_bundle = "/usr/syno/etc/certificate/system/default/ECC-fullchain.pem"
    # certificate = "/usr/syno/etc/certificate/system/default/ECC-cert.pem"
    # private = "/usr/syno/etc/certificate/system/default/ECC-privkey.pem"
    # socketio.run(app, host="0.0.0.0", port=9090, ssl_context=(certificate, private))