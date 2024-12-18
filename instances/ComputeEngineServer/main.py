"""
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

# Note: Tensorflow has to be imported before everything else otherwise a CUBLAS error appears
import tensorflow as tf
tf.compat.v1.disable_eager_execution()
#config = tf.compat.v1.ConfigProto()
#config.gpu_options.allow_growth = True
#session = tf.compat.v1.Session(config=config)
from socketserver import ThreadingMixIn
import threading
import multiprocessing

from http.server import BaseHTTPRequestHandler, HTTPServer, SimpleHTTPRequestHandler
import os
import json
import re
import numpy as np
from Request.GetRequest import GetRequest
from Request.PostRequest import PostRequest
import requests
import ssl

import subprocess

init_path = "data"

# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class MyServer(SimpleHTTPRequestHandler):
    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    def do_GET(self):
        print("#################################################################")
        print("# Receive...")
        uri = self.path.split("?")
        if uri[0] == "/server_status" or uri[0] == "/available_methods" or \
           uri[0] == "/database" or uri[0] == "/available_metrics" or \
           uri[0] == "/check_availability" or uri[0] == "/object_information":

            self.send_response(200)
            self.send_header("Content-type", "text/html")
            #self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

        response = {
            "service": None,
            "enabled": "false",
            "data": None
        }

        if uri[0] == "/server_status":
            response = GetRequest.server_status(self, response)
        elif uri[0] == "/available_methods":
            response = GetRequest.available_methods(response)
        elif uri[0] == "/available_metrics":
            response = GetRequest.available_metrics(response)
        elif uri[0] == "/database":
            response = GetRequest.database(init_path, response)
        elif uri[0] == "/check_availability":
            response = GetRequest.check_availability(init_path, response)
        elif uri[0] == "/object_information":
            response = GetRequest.object_information(response, uri[1])
        else:
            return SimpleHTTPRequestHandler.do_GET(self)

        self.wfile.write(bytes(str(response), "utf-8"))

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    #@timeout_decorator.timeout(5, use_signals=False)
    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.send_header("Access-Control-Allow-Methods", "DELETE, POST, GET, OPTIONS")
        self.send_header("keep-alive", "timeout=60, max=60")
        #self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        #self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        response = {
            "service": None,
            "enabled": "false",
            "data": {
                "histogram": [],
                "mean": [],
                "std": [],
                "extension": "",
                "message": ""
            }
        }

        # apply color transfer if this url is posted by user
        if self.path == "/color_transfer":

            try:
                manager = multiprocessing.Manager()
                return_dict = manager.dict()
                p = multiprocessing.Process(target=PostRequest.color_transfer, args=(self.getJson(), init_path, response, return_dict), daemon=True)
                p.start()
                p.join()
                response = return_dict.values()[0]
            except:
                response

            #print(response)

            # python_bin = os.path.dirname(os.path.abspath(__file__)) + "/env/bin/python"
            # # Path to the script that must run under the virtualenv
            # script_file = "Request/ColorTransfer.py"
            # script_args = [str(self.getJson()), "arg2_value"]
            # p = subprocess.Popen([python_bin, script_file] + script_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # stdout, stderr = p.communicate()

            # # Den Rückgabewert ausgeben
            # print("Standardausgabe:", stdout.decode())
            # print("Fehlerausgabe:", stderr.decode())
            # print("Rückgabewert:", p.returncode)



        elif self.path == "/color_histogram":
            response = PostRequest.color_histogram(self, init_path, response)
        elif self.path == "/color_distribution":
            response = PostRequest.color_distribution(self, init_path, response)
        elif self.path == "/upload":
            """Handle a POST request."""
            PostRequest.upload(self)
            # # Save files received in the POST
            # wasSuccess, files_uploaded = self.handle_file_uploads()
            # print(wasSuccess)

            # # Compose a response to the client
            # response_obj = {
            #     "wasSuccess": wasSuccess,
            #     "files_uploaded": files_uploaded,
            #     "client_address": self.client_address
            # }

            # response_str = json.dumps(response_obj)

            # self.log_message(response_str)

            # # Send our response code, header, and data
            # self.send_response(200)
            # self.send_header("Content-type", "Application/json")
            # self.send_header("Content-Length", len(response_str))
            # self.end_headers()
            # self.wfile.write(response_str.encode('utf-8'))
        elif self.path == "/evaluation":
            #response = PostRequest.evaluation(self.getJson(), init_path, response)

            try:
                manager = multiprocessing.Manager()
                return_dict = manager.dict()
                p = multiprocessing.Process(target=PostRequest.evaluation, args=(self.getJson(), init_path, response, return_dict), daemon=True)
                p.start()
                p.join()
                response = return_dict.values()[0]
            except:
                response


        elif self.path == "/object_info":
            response = PostRequest.object_info(self, init_path, response)

        print("\033[92m" + "Request fulfilled" + "\033[0m")
        self.wfile.write(bytes(str(response), "utf-8"))

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    def getJson(self):
        datalen = int(self.headers['Content-Length'])
        data = self.rfile.read(datalen)
        obj = json.loads(data)
        return obj

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    def read_line(self):
        line_str = self.rfile.readline().decode('ISO-8859-1')
        self.char_remaining -= len(line_str)
        return line_str




class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""

# ------------------------------------------------------------------------------------------------------------------
# method description
# ------------------------------------------------------------------------------------------------------------------
def run(server_protocol, server_address, server_port, server_class=HTTPServer, handler_class=BaseHTTPRequestHandler):    
    url = (server_address, server_port)
    httpd = ThreadedHTTPServer(url, handler_class)
    if server_protocol == "https":
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_verify_locations('../../ressources/security/ca_bundle.crt')
        context.load_cert_chain(certfile='../../ressources/security/certificate.crt', keyfile='../../ressources/security/private.key')
        context.check_hostname = False
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    httpd.serve_forever()

# ------------------------------------------------------------------------------------------------------------------
# send the IP address and port to the proxy server
# ------------------------------------------------------------------------------------------------------------------
def sendServerInfo(proxy_protocol, proxy_address, proxy_port, ressource, server_name, server_protocol, my_address, my_port, server_visibility):
    url = proxy_protocol + "://" + proxy_address + ":" + str(proxy_port) + ressource
    print(url)
    myobj = {
        "name": server_name,
        "protocol": server_protocol,
        "address": my_address,
        "port": my_port,
        "visibility": server_visibility
    }

    try:
        x = requests.post(url, json = myobj, verify=True)
    except:
        print("No connection to the proxy server can be established.")
        exit(1)

# ------------------------------------------------------------------------------------------------------------------
# read settings file, i.e. proxy address and port
# ------------------------------------------------------------------------------------------------------------------
def read_settings(path):
    with open(path, 'r') as f:
        data = json.load(f)

        SI2_name = data["SI2"]["name"]
        SI2_protocol = data["SI2"]["protocol"]
        SI2_lan = data["SI2"]["lan"]
        SI2_port = data["SI2"]["port"]
        SI2_wan = data["SI2"]["wan"]
        SI2_visibility = data["SI2"]["visibility"]

        SI1_protocol = data["SI1"]["protocol"]
        SI1_wan = data["SI1"]["wan"]
        SI1_port = data["SI1"]["port"]
        return SI2_name, SI2_protocol, SI2_lan, SI2_port, SI2_wan, SI2_visibility, SI1_protocol, SI1_port, SI1_wan

# ------------------------------------------------------------------------------------------------------------------
# method description
# ------------------------------------------------------------------------------------------------------------------
def main():
    #os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
    multiprocessing.set_start_method('spawn')

    SI2_name, SI2_protocol, SI2_lan, SI2_port, SI2_wan, SI2_visibility, SI1_protocol, SI1_port, SI1_wan = read_settings("../../ressources/settings/settings.json")
    print("#################################################################")
    print("# Server " + SI2_name + " is running on " + SI2_protocol + "://" + SI2_lan + ":" + str(SI2_port) + " ...")
    print("#################################################################")

    sendServerInfo(SI1_protocol, SI1_wan, SI1_port, "/ip_update", SI2_name, SI2_protocol, SI2_wan, SI2_port, SI2_visibility)
           
    run(SI2_protocol, SI2_lan, SI2_port, handler_class=MyServer)


if __name__ == '__main__':
    main()
