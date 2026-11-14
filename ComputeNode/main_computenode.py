"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import warnings
import sys
warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API*", category=UserWarning)

# Keep native numerical libraries predictable on macOS. Some Chang03
# dependencies are not safe to interrupt from a worker thread.
import os
if sys.platform == "darwin":
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
    os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")

import asyncio
import argparse
from utils.utils import Utils
import uuid

# Parse command-line arguments
parser = argparse.ArgumentParser(description="WebRTC Client")
parser.add_argument("--input", type=str, help="The message to send automatically")
parser.add_argument("--web", action="store_true", help="Run the ComputeNode interface in a browser")
parser.add_argument("--web-host", default="127.0.0.1", help="Web interface bind address")
parser.add_argument("--web-port", type=int, default=8080, help="Web interface port")
args = parser.parse_args()

# Keep the original eager import order for the Qt/native compute mode. The
# browser mode can serve its UI without importing optional compute packages.
if not args.web:
    from utils.segmentation import segment
    from utils.webrtc import WebRTCClient

#SIGNAL_SERVER = "http://localhost:8071"
SIGNAL_SERVER = "https://signal.potechius.com"

# Generate a deterministic client ID based on the MAC address, so that it remains consistent across restarts on the same machine
mac = uuid.getnode()
CLIENT_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(mac)))

PASSWORD = "test"

ORANGE = '\033[33m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'

# ------------------------------------------------------------------------------------------------------------------
# Waits for client.connection_event to be set, with a timeout.
# Returns True if connection established, False if timeout occurred.
# ------------------------------------------------------------------------------------------------------------------
async def wait_for_connection(client, window=None, timeout=20.0):
    try:
        await asyncio.wait_for(client.connection_event.wait(), timeout=timeout)
        return True
    except asyncio.TimeoutError:
        Utils.printWARN(f"Timeout waiting for WebRTC connection. Performing reset...", window)
        # call force_reset only if exists
        if hasattr(client, "force_reset") and callable(client.force_reset):
            await client.force_reset()
        else:
            # fallback: clear event and reset peer connection
            client.connection_event.clear()
            if hasattr(client, "reset_peer_connection"):
                client.reset_peer_connection()
        return False

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
async def main_server(window=None):
    # Import the compute stack only when the user starts a connection. This
    # allows the browser interface to open on machines without CUDA packages.
    if args.web:
        from utils.webrtc import WebRTCClient as rtc_client_class
    else:
        rtc_client_class = WebRTCClient

    client = rtc_client_class(
        signal_server=window.signal_server,
        client_id=CLIENT_ID,
        compute_node_name=window.compute_node_name,
        compute_node_privacy=window.compute_node_privacy,
        window=window
    )
    try:
        await client.connect_to_signal_server()
    except Exception as e:
        Utils.printINFO(f"Error while connecting to signal server: {e}", window)
        import traceback
        traceback.print_exc()
        return

    # Update the status of the client to online in the user interface
    window.set_signal_server_status("Connected")
    window.set_compute_node_status("Idle")
    window.set_compute_node_id(CLIENT_ID)

    while True:
        Utils.printINFO(f"Waiting for incoming connection...", window)

        connected = await wait_for_connection(client, window=window, timeout=25.0)
        if not connected:
            # Restart wait loop immediately
            continue

        Utils.printINFO(f"Connection established", window)

        # Wait until connection is lost or broken
        await asyncio.sleep(0.5)
        while client.connection_event.is_set():
            await asyncio.sleep(0.5)

        Utils.printSEND(f"Inform Signal Server about new status: Idle", window)

        # reset status in user interface for client and compute node
        window.set_compute_node_status("Idle")

        Utils.printINFO(f"Connection lost. Waiting to reconnect...", window)
        client.connected_clients = []
        client.connected_participants = []
    
# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    if args.web:
        from utils.web_interface import WebInterface
        interface = WebInterface(main_server, SIGNAL_SERVER, PASSWORD,
                                 host=args.web_host, port=args.web_port)
        asyncio.run(interface.start())
    else:
        from utils.interface import Interface
        Interface(main_server, SIGNAL_SERVER, PASSWORD)
