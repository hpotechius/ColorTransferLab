from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit

import geocoder
import requests
import logging
import time
import json
import sqlite3
from mailhandler import send_email
import signal



app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=600, ping_interval=30)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

SS_SID = None

sql_conn = None
CONN = None

ce_servers = {
    "ce1": {
        "name": "Compute Engine 1",
        "id": "123456",
        "status": "Idle",
    },
    "ce2": {
        "name": "Compute Engine 2",
        "id": "1234567",
        "status": "Busy",
    },
    "ce3": {
        "name": "Compute Engine 3",
        "id": "1234567",
        "status": "Busy",
    },
    "ce4": {
        "name": "Compute Engine 4",
        "id": "1234567",
        "status": "Busy",
    },
    "ce5": {
        "name": "Compute Engine 5",
        "id": "1234567",
        "status": "Busy",
    }
}
db_servers = {}

# Example:
# name:            Name of the client: Always has the format Client-<4 digit ID>
# status:          Possible values for Client: Idle, Connected (1/2), Connected (2/2)
#                  Possible values for Database and Compute Engine: Idle, Busy
# type:            Possible values: Client, Database, ComputeEngine
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
clients = {}

# ANSI-Escape-Sequence for colored output
# ORANGE: General information
# GREEN: Sending messages
# BLUE: Receiving messages
ORANGE = '\033[33m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'


# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", clients={**clients, **db_servers})

# ------------------------------------------------------------------------------------------------------------------
# Will be executed when a client connects to the server
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("connect")
def on_connect():
    print(f"{BLUE}[RECV] Client/Server connects...{RESET}")

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("disconnect")
def on_disconnect():
    removed_client = False
    removed_db_server = False
    removed_ce_server = False

    print(f"{BLUE}[RECV] Client/Server Disonnected{RESET}")
    # Remove client from clients dictionary
    for client_id, client_data in list(clients.items()):
        sid = client_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Disonnect Client: {client_id}{RESET}")
            del clients[client_id]
            break

    

    for client_id, client_data in list(db_servers.items()):
        sid = client_data["sid"]
        if sid == request.sid:
            print(f"{ORANGE}[INFO] Remove Database Server {client_id}{RESET}")
            removed_db_server = True
            del db_servers[client_id]
            break

    if removed_db_server:
        print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
        for client_id, client_data in list(clients.items()):
            sid = client_data["sid"]
            emit("db_request", db_servers, to=sid)
    
    #print(request.sid)
    #print(clients)
    socketio.emit('update_clients', {**clients, **db_servers})

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("message")
def on_message(data):
    from_id = data.get("from")
    target_id = data.get("target")

    print(f"{BLUE}[RECV] Message received from {from_id} to {target_id}{RESET}")

    # Check if message is for the server
    if target_id == "server":
        print(f'{ORANGE}[INFO] Message for Signal Server: {data.get("message")}{RESET}')
        # Client requests list of database servers
        if data.get("message") == "/database":
            emit("db_request", db_servers, to=request.sid)
        # Database server sends status update
        elif data.get("message") == "feedback":
            print(f'{GREEN}[SEND] Send Feedback with title: {data.get("data")["category"]}{RESET}')
            subject = "Feedback: " + data.get("data")["category"]
            body = data.get("data")["message"]
            to_email = "123"
            from_email = "123"
            smtp_server = "123"
            smtp_port = 587
            smtp_user = "123"
            smtp_password = "123"

            send_email(subject, body, to_email, from_email, smtp_server, smtp_port, smtp_user, smtp_password)
        # Database server sends status update
        elif data.get("message") == "update_status":
            print("Updating status")
            print(f'{ORANGE}[INFO] Updating Client and Database Server{RESET}')
            # Update Client information in Database Server Information
            db_servers[data.get("from")]["status"] = data.get("data")["status"]
            db_servers[data.get("from")]["connected_cl"] = data.get("data")["connected_cl"]
            # Update Database Server information in Client Information

            # if the database is disconnected from the client, no need to update the client
            if(data.get("data")["connected_cl"] != ""):
                clients[data.get("data")["connected_cl"]]["connected_db"] = data.get("from")
                clients[data.get("data")["connected_cl"]]["status"] = "Connected"


            socketio.emit('update_clients', {**clients, **db_servers})
            # Upate status of database server and send to all clients
            print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
            for client_id, client_data in list(clients.items()):
                sid = client_data["sid"]
                emit("db_request", db_servers, to=sid)
            #print(data.get("from"))
        else:
            print("Unknown server", data.get("message"))
        return

    # Check if message is for the database server
    if target_id in db_servers:
        print(f"{ORANGE}[SEND] Forwarding message to Database Server {target_id}{RESET}")

        # check privacy setting of compute node. If privacy is enabled, only forward messages from the same IP
        if db_servers[target_id]["privacy"] and db_servers[target_id]["ip_address"] != request.remote_addr:
            print(f"{ORANGE}[INFO] Privacy enabled. Message not forwarded{RESET}")
            return

        sid = db_servers[target_id]["sid"]
        emit("message", data, to=sid)
    # Check if message is for a client
    elif target_id in clients:
        print(f"{ORANGE}[SEND] Forwarding message to Client {target_id}{RESET}")
        print(data)
        sid = clients[target_id]["sid"]
        emit("message", data, to=sid)

    else:
        print(f"Client {target_id} not found")

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
def get_country_from_ip(ip_address):
    try:
        response = requests.get(f'https://geolocation-db.com/json/{ip_address}&position=true')
        data = response.json()
        return data.get('country_name', 'Unknown')
    except requests.RequestException as e:
        print(f"Error fetching country for IP {ip_address}: {e}")
        return 'Unknown'

# ------------------------------------------------------------------------------------------------------------------
# Registers a connected client
# ------------------------------------------------------------------------------------------------------------------
@socketio.on("register")
def on_register(data):
    SS_SID = request.sid
    client_id = data["client_id"]
    client_country = get_country_from_ip(request.remote_addr)  # Land aus der IP-Adresse ermitteln

    new_dict = {
        "name": data["name"],
        "sid": request.sid,
        "ip_address": request.remote_addr,
        "country": client_country,
        "register_time": time.time(),
        "type": data["type"],
        "status": "Idle",
        "connected_cl": "",
        "connected_db": "",
        "connected_ce": "",
        "privacy": False
    }

    # CONN = sqlite3.connect('connections.db')
    # sql_conn = CONN.cursor()

    # sql_conn.execute('''INSERT INTO users (id, name, ip, country, type, starttime) 
    #                   VALUES (?, ?, ?, ?, ?, ?)''', 
    #                   (client_id, new_dict["name"], new_dict["ip_address"], new_dict["country"], new_dict["type"], new_dict["register_time"]))
    
    # CONN.commit()
    # CONN.close()

    if data["type"] == "Client":
        print(f"{ORANGE}[INFO] Register Client {client_id}{RESET}")
        clients[client_id] = new_dict
    elif data["type"] == "Database":
        # Save new database server
        print(f"{ORANGE}[INFO] Register Compute Node {client_id}{RESET}")
        db_servers[client_id] = new_dict
        db_servers[client_id]["privacy"] = data["privacy"]

        print(f"{GREEN}[SEND] Send updated Database List to all Clients{RESET}")
        for client_id, client_data in list(clients.items()):
            sid = client_data["sid"]
            emit("db_request", db_servers, to=sid)

    
    # Send Ip Address to Compute Node to same Compute Node 
    print(f"{GREEN}[SEND] Send IP Address {request.remote_addr} to registered Instance with ID {client_id}{RESET}")
    emit("/ip_address", request.remote_addr, to=SS_SID)

    emit("sid", SS_SID, to=SS_SID)

    socketio.emit('update_clients', {**clients, **db_servers})
        
# ------------------------------------------------------------------------------------------------------------------
# Funktion, die beim Empfang des SIGINT-Signals ausgeführt wird
# ------------------------------------------------------------------------------------------------------------------
def signal_handler(sig, frame):
    def print_database():
        CONN = sqlite3.connect('connections.db')
        sql_conn = CONN.cursor()
        sql_conn.execute("SELECT * FROM users")
        rows = sql_conn.fetchall()
        for row in rows:
            print(row)
        CONN.close()
    print("SIGINT empfangen. Programm wird beendet. Datenbankinhalt:")
    print_database()
    CONN.close()
    exit(0)

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    # Registrieren des Signal-Handlers
    signal.signal(signal.SIGINT, signal_handler)

    # Verbindung zur SQLite-Datenbank herstellen (erstellt die Datenbank, falls sie nicht existiert)
    CONN = sqlite3.connect('connections.db')
    sql_conn = CONN.cursor()

    # Erstellen einer Tabelle
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
    socketio.run(app, host="0.0.0.0", port=8080)

    # ca_bundle = "/usr/syno/etc/certificate/system/default/ECC-fullchain.pem"
    # certificate = "/usr/syno/etc/certificate/system/default/ECC-cert.pem"
    # private = "/usr/syno/etc/certificate/system/default/ECC-privkey.pem"
    # socketio.run(app, host="0.0.0.0", port=9090, ssl_context=(certificate, private))