"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import os
from ColorTransferLib.ColorTransfer import ColorTransfer, ColorTransferEvaluation
from ColorTransferLib.DataTypes.Mesh import Mesh
from ColorTransferLib.DataTypes.GaussianSplatting import GaussianSplatting
from ColorTransferLib.DataTypes.LightField import LightField
from ColorTransferLib.DataTypes.VolumetricVideo import VolumetricVideo
from ColorTransferLib.DataTypes.Image import Image
from ColorTransferLib.DataTypes.Video import Video
from .segmentation import segment
import json
from utils.utils import Utils
import numpy as np
import asyncio
from os import path
import zipfile
import importlib.util

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for the database structure and sends it back to the client.
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetDatabaseStructure(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests database structure via command: {command_recv}.", client.window)
    Utils.printSEND(f"Sending database structure.", client.window)

    database_path = os.path.abspath("files/data")
    for _ in range(120):
        if os.path.isdir(database_path):
            break
        await asyncio.sleep(0.5)
    db_structure = Utils.get_database_structure(database_path)

    client.send_datachannel_message({
        "message": "/getDatabaseStructureResponse",
        "data" : db_structure
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for semantic segmentation.
# ------------------------------------------------------------------------------------------------------------------
async def handlerSemantics(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests semantics via: {command_recv}.", client.window)

    # Load input image from files/data
    img_path = os.path.join("files/data", data_recv["image"])
    in_img = Image(file_path=img_path)
    out_img = segment(client, in_img, data_recv["semantics"])

    # Output path for segmentation: files/semantics/<image-rel-path>
    seg_out_path = os.path.join("files/semantics", data_recv["image"])

    # Create output directory if it doesn't exist
    seg_out_dir = os.path.dirname(seg_out_path)
    os.makedirs(seg_out_dir, exist_ok=True)

    # Save segmentation
    out_img.write(seg_out_path.split(".")[0])

    data_recv["abstractPath"] = data_recv["image"]
    data_recv["rid"] = data_recv["view"]
    data_recv["mode"] = "semantics"

    # Send segmentation file to client
    await client.sendFiles(data_recv, "Image", client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for the list of available methods and their options.
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetMethods(client, message, client_id):
    Utils.printRECV(f"Client requests list of methods via: {message}.", client.window)

    methodsStruct = Utils.read_json_file("meta/methods.json")
    availableMethods = methodsStruct["data"]

    Utils.printINFO(f"Read options for all available methods.", client.window)

    av_methods = {}
    for met in availableMethods:
        dirname = Utils.get_library_path("ColorTransferLib")
        filename = os.path.join(dirname, "Options/" + met["key"] + ".json")

        with open(filename, 'r') as f:
            options = json.load(f)

        av_methods[met["key"]] = options

    client.send_datachannel_message({
        "message": "/getMethodsResponse",
        "data" : availableMethods
    }, client_id)

    client.send_datachannel_message({
        "message": "/getOptionsResponse",
        "data" : av_methods
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles request to upload a file
# ------------------------------------------------------------------------------------------------------------------
async def handlerUploadStart(client,message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    Utils.printRECV(f"Client requests start of upload of file via command: {command_recv}.", client.window)
    client.received_arraybuffer = []
    client.received_file_name = data_recv

# ------------------------------------------------------------------------------------------------------------------
# 
# ------------------------------------------------------------------------------------------------------------------
async def handlerUploadEnd(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    Utils.printRECV(f"Client requests end of upload of file via command: {command_recv}.", client.window)

    # Combine the received ArrayBuffer chunks into a single bytes object
    combined_bytes = b''.join(client.received_arraybuffer)

    # Saving the resulting bytes as a PNG file
    fpath = path.join("files/data/Uploads/" + client.received_file_name)
    with open(fpath, 'wb') as f:
        f.write(combined_bytes)
    client.received_arraybuffer = []
    client.received_file_name = ""

    Utils.printSEND(f"Sending updated database structure.", client.window)
    db_structure = Utils.get_database_structure()
    client.send_datachannel_message({
        "message": "/getDatabaseStructureResponse",
        "data" : db_structure
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for calculating an evaluation metric.
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetEvaluation(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests evaluation via: {command_recv} for metric: {data_recv}.", client.window)

    src_path = os.path.join("files/data", data_recv["source"])
    ref_path = os.path.join("files/data", data_recv["reference"])
    out_path = os.path.join("files/data", data_recv["output"])
    metric = data_recv["metric"]

    src_img = Image(file_path=src_path)
    ref_img = Image(file_path=ref_path)
    out_img = Image(file_path=out_path)

    # get all metrics and add to response["data"]
    cte = ColorTransferEvaluation(src_img, ref_img, out_img)
    
    evalval = cte.apply(metric)

    # ensure evalval is JSON-serializable (convert np.float64 -> float)
    try:
        if isinstance(evalval, (np.generic, np.ndarray)):
            evalval = float(evalval)
    except Exception:
        # fallback: leave as-is; json.dumps will handle basic types
        pass

    Utils.printSEND(f"Sending Evaluation Result for {metric}.", client.window)

    payload = {
        "message": "/getEvaluationResponse",
        "data": {
            "metric": metric,
            "value": evalval,
        },
    }

    client.send_datachannel_message(payload, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for performing color transfer.
#
# data_recv: {
#   "source": "source.png",
#   "reference": "reference.png",
#   "approach": "Su20",
#   "options": { ... },
#   "output": "output"
# }
# ------------------------------------------------------------------------------------------------------------------
async def handlerColorTransfer(client, message, client_id):
    # 1. Extract data from message
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    Utils.printRECV(f"Client requests color transfer via: {command_recv}.", client.window)

    base_path = "files/data"
    tmp_folder = "tmp"

    src_file_name, src_file_ext = data_recv["source"].split("/")[-1].split(".")
    src_folder = data_recv["source"].split("/")[:-1]

    out_file_name = data_recv["output"].split("/")[-1]
    out_file_ext = src_file_ext
    out_folder = data_recv["output"].split("/")[:-1]

    src_file_path = os.path.join(base_path, *src_folder, src_file_name + "." + src_file_ext)
    src_raw_path = os.path.join(base_path, tmp_folder, src_file_name)

    method_id = data_recv["approach"]
    method_options = data_recv["options"]
    reference_path = data_recv.get("reference")
    colorization_methods = {"Kang23", "Ji22", "Su20"}

    if not reference_path and method_id not in colorization_methods:
        output = {
            "status_code": -1,
            "response": "A reference image is required for this algorithm.",
            "object": None,
            "process_time": 0,
        }
        client.send_datachannel_message({
            "message": "error",
            "data": output,
        }, client_id)
        return

    ref_file_name = ref_file_ext = ref_folder = ref_file_path = ref_raw_path = None
    if reference_path:
        ref_file_name, ref_file_ext = reference_path.split("/")[-1].split(".")
        ref_folder = reference_path.split("/")[:-1]
        ref_file_path = os.path.join(base_path, *ref_folder, ref_file_name + "." + ref_file_ext)
        ref_raw_path = os.path.join(base_path, tmp_folder, ref_file_name)

    if method_id == "Su20" and importlib.util.find_spec("detectron2") is None:
        output = {
            "status_code": -1,
            "response": (
                "Su20 requires Detectron2, which is not available on macOS. "
                "Run Su20 on a supported Linux/CUDA environment."
            ),
            "object": None,
            "process_time": 0,
        }
        client.send_datachannel_message({
            "message": "error",
            "data": output,
        }, client_id)
        return

    mesh_zip_path = None

    try:
        # ----------------- SRC initialization -----------------
        if src_file_ext == "png" or src_file_ext == "jpg":
            src = Image(file_path=src_file_path)
        elif src_file_ext == "ply":
            src = Mesh(file_path=src_file_path, datatype="PointCloud")
        elif src_file_ext == "mp4":
            src = Video(file_path=src_file_path)
        elif src_file_ext == "ksplat" or src_file_ext == "splat":
            src = GaussianSplatting(file_path=src_file_path)
        elif src_file_ext == "mesh":
            src_raw_obj_path = os.path.join(src_raw_path, src_file_name + ".obj")
            # Extract src .mesh (ZIP) to temp folder 
            Utils.extract_zip(src_file_path, src_raw_path)
            src = Mesh(file_path=src_raw_obj_path, datatype="Mesh")

            # OUT HANDLING FOR MESH FILES
            # Create temorary output folder for generated .obj, .mtl, .png output
            out_raw_path = os.path.join(base_path, tmp_folder, out_file_name)
            os.makedirs(out_raw_path, exist_ok=True)
        elif src_file_ext == "lf":
            # SRC HANDLING FOR LIGHTFIELD FILES in LF format: expects .lf (ZIP) containing .mp4 and .json
            src_raw_mp4_path = os.path.join(src_raw_path, src_file_name + ".mp4")
            src_raw_json_path = os.path.join(src_raw_path, src_file_name + ".json")
            # Extract src .lf (ZIP) to temp folder 
            Utils.extract_zip(src_file_path, src_raw_path)

            # Open json to read grid size
            with open(src_raw_json_path, 'r') as f:
                lightfield_meta = json.load(f)
                grid_width = lightfield_meta["grid_width"]
                grid_height = lightfield_meta["grid_height"]
            src = LightField(file_path=src_raw_mp4_path, size=(grid_width, grid_height))

            # OUT HANDLING FOR LIGHTFIELD FILES
            # Create temorary output folder for generated .mp4, .json output
            out_raw_path = os.path.join(base_path, tmp_folder, out_file_name)
            os.makedirs(out_raw_path, exist_ok=True)
            out_raw_json_path = os.path.join(out_raw_path, out_file_name + ".json")
            with open(out_raw_json_path, 'w') as json_file:
                json.dump(lightfield_meta, json_file, indent=4)
        elif src_file_ext == "lfd":
            # SRC HANDLING FOR LIGHTFIELD FILES in lfd format:
            # expects .ldf (ZIP) containing multiple .png files and a .json
            src_raw_json_path = os.path.join(src_raw_path, src_file_name + ".json")

            # Extract src .ldf (ZIP) to temp folder
            Utils.extract_zip(src_file_path, src_raw_path)

            # Open json to read grid size
            with open(src_raw_json_path, "r") as f:
                lightfield_meta = json.load(f)
                grid_width = lightfield_meta["grid_width"]
                grid_height = lightfield_meta["grid_height"]

            # Load lightfield from extracted image folder
            src = LightField(file_path=src_raw_path, isVideo=False, size=(grid_width, grid_height))

            # OUT HANDLING FOR LIGHTFIELD FILES
            # Create temporary output folder for generated images + json
            out_raw_path = os.path.join(base_path, tmp_folder, out_file_name)
            os.makedirs(out_raw_path, exist_ok=True)
            out_raw_json_path = os.path.join(out_raw_path, out_file_name + ".json")
            with open(out_raw_json_path, "w") as json_file:
                json.dump(lightfield_meta, json_file, indent=4)
        elif src_file_ext == "volu":
            # SRC HANDLING FOR VOLUMETRIC VIDEO FILES
            src_raw_json_path = os.path.join(src_raw_path, src_file_name + ".json")
            # Extract src .volu (ZIP) to temp folder 
            Utils.extract_zip(src_file_path, src_raw_path)
            # Open json to read grid size
            with open(src_raw_json_path, 'r') as f:
                volumetric_meta = json.load(f)
                num_frames = volumetric_meta["num_frames"]
            src = VolumetricVideo(folder_path=src_raw_path, file_name=src_file_name)

            # OUT HANDLING FOR VOLUMETRIC VIDEO FILES
            # Create temorary output folder for generated .mp4, .json output
            out_raw_path = os.path.join(base_path, tmp_folder, out_file_name)
            os.makedirs(out_raw_path, exist_ok=True)
            out_raw_json_path = os.path.join(out_raw_path, out_file_name + ".json")
            with open(out_raw_json_path, 'w') as json_file:
                json.dump(volumetric_meta, json_file, indent=4)
        else:
            src = None

        # ----------------- REF initialization -----------------
        if not reference_path:
            # Colorization algorithms do not use reference pixels, but some
            # library entry points still require an Image-like reference.
            if method_id in colorization_methods and src is not None:
                ref = Image(array=np.zeros_like(src.get_raw()), normalized=True)
            else:
                ref = None
        elif ref_file_ext == "png" or ref_file_ext == "jpg":
            ref = Image(file_path=ref_file_path)
        elif ref_file_ext == "ply":
            ref = Mesh(file_path=ref_file_path, datatype="PointCloud")
        elif src_file_ext == "ksplat" or src_file_ext == "splat":
            ref = GaussianSplatting(file_path=ref_file_path)
        elif ref_file_ext == "mesh":
            ref_raw_obj_path = os.path.join(ref_raw_path, ref_file_name + ".obj")
            # Extract ref .mesh (ZIP) to temp folder 
            Utils.extract_zip(ref_file_path, ref_raw_path)
            ref = Mesh(file_path=ref_raw_obj_path, datatype="Mesh")
        else:
            ref = None

        # ----------------- Execute Color Transfer -----------------
        ct = ColorTransfer(src, ref, method_id)
        ct.set_options(method_options)

        try:
            # Keep the asyncio event loop responsive while native algorithms
            # perform CPU/GPU work in a background thread.
            algorithm_task = asyncio.create_task(asyncio.to_thread(ct.apply))
            output = await asyncio.wait_for(asyncio.shield(algorithm_task), timeout=180)
        except asyncio.TimeoutError:
            output = {
                "status_code": -1,
                "response": "The algorithm took longer than 180 seconds to process.",
                "object": None,
                "process_time": 0
            }
            client.send_datachannel_message({
                "message": "warning",
                "data" : output
            }, client_id)
            return

        if output is None:
            output = {
                "status_code": -1,
                "response": "An Error occured during the color transfer process.",
                "object": None,
                "process_time": 0
            }
            client.send_datachannel_message({
                "message": "error",
                "data" : output
            }, client_id)
            return

        if output["status_code"] == -1:
            return

        # If it's a mesh: pack obj/mtl/png into a .mesh (ZIP) file
        if out_file_ext == "mesh" or out_file_ext == "lf" or out_file_ext == "lfd" or out_file_ext == "volu":  # and output_write_path and mesh_zip_path:
            # Note: the path of has to look like: files/data/tmp/<out_file_name>/<out_file_name>
            # First <out_file_name> is folder, second is the base name of the .obj/.mtl/.png files
            out_raw_files_path = os.path.join(out_raw_path, out_file_name)
            print(f"Saving output to: {out_raw_files_path}")
            output["object"].write(out_raw_files_path)

            # Create final .mesh (ZIP) file path
            mesh_zip_path = os.path.join(base_path, *out_folder, out_file_name + "." + out_file_ext)
            print(f"Saving output to: {mesh_zip_path}")
            with zipfile.ZipFile(mesh_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for root_dir, _, files in os.walk(out_raw_path):
                    for fname in files:
                        full_path = os.path.join(root_dir, fname)
                        arcname = os.path.relpath(full_path, out_raw_path)
                        zf.write(full_path, arcname)
        # normal files (non-zip files) (Image, Video, PointClouds)
        else:    
            out_file_path = os.path.join(base_path, *out_folder, out_file_name)
            print(f"Saving output to: {out_file_path}")
            output["object"].write(out_file_path)

        await asyncio.sleep(5.00)

        Utils.printSEND(f"Sending Files...", client.window)
        convertedType = Utils.typeConversion[src_file_ext]
        Utils.printINFO(f"Handling {convertedType} File.", client.window)
        data_recv["abstractPath"] = os.path.join(*out_folder, out_file_name + "." + out_file_ext)
        data_recv["rid"] = "out"
        await client.sendFiles(data_recv, convertedType, client_id)

        Utils.printSEND(f"Sending updated database structure.", client.window)
        db_structure = Utils.get_database_structure()
        client.send_datachannel_message({
            "message": "/getDatabaseStructureResponse",
            "data" : db_structure
        }, client_id)

    except Exception as e:
        Utils.printWARN(f"Error during color transfer: {e}", client.window)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request for a file
# ------------------------------------------------------------------------------------------------------------------
async def handlerFile(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests file via command: {command_recv}.", client.window)

    # Create file path depending on received file extension
    file_extension = data_recv["abstractPath"].split(".")[1]

    try:
        Utils.printSEND(f"Sending Files...", client.window)
        convertedType = Utils.typeConversion[file_extension]
        Utils.printINFO(f"Handling {convertedType} File.", client.window)
        await client.sendFiles(data_recv, convertedType, client_id)
    except Exception as e:
        Utils.printWARN(f"Error sending file: {e}", client.window)

# ------------------------------------------------------------------------------------------------------------------
# Checks if a semantic file is available
# ------------------------------------------------------------------------------------------------------------------
async def handlerFileAvailability(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests file availability via: {command_recv}.", client.window)

    file_path = os.path.join("files/semantics", data_recv["abstractPath"])

    # Check if file exists
    exists = os.path.exists(file_path)

    Utils.printINFO(
        f"Semantic file '{data_recv['abstractPath']}' exists: {exists}",
        client.window
    )

    # Ergebnis an Client zurücksenden
    client.send_datachannel_message({
        "message": "fileAvailability",
        "data": {
            "abstractPath": data_recv["abstractPath"],
            "rid": data_recv["rid"],
            "exists": exists
        }
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to update the IP address of a client
# ------------------------------------------------------------------------------------------------------------------
async def handlerPutIpAddress(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    Utils.printRECV(f"Client send own information via command: {command_recv}.", client.window)

    client.window.connections_data[data_recv["client_name"]] = {
        "ip_address": data_recv["ip_address"],
        "id": data_recv["client_id"],
        "status": "Connected",
    }

    client.window.set_client_box()
    client.window.set_client_status("Connected")
    client.window.set_compute_node_status("Connected")