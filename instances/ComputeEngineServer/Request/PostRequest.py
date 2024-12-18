"""
Copyright 2022 by Herbert Potechius,
Ernst-Abbe-Hochschule Jena - University of Applied Sciences - Department of Electrical Engineering and Information
Technology - Immersive Media and AR/VR Research Group.
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import os
import func_timeout
import json
import re
import numpy as np
import cv2
import open3d as o3d
from zipfile import ZipFile
import gc
import torch
import multiprocessing

from ColorTransferLib.ColorTransfer import ColorTransfer, ColorTransferEvaluation
from ColorTransferLib.MeshProcessing.Mesh import Mesh
from ColorTransferLib.MeshProcessing.VolumetricVideo import VolumetricVideo
from ColorTransferLib.ImageProcessing.Image import Image
from ColorTransferLib.ImageProcessing.Video import Video

import subprocess

class PostRequest():
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def evaluation(obj, init_path, response, return_dict):
        file_src = obj["source"]
        _, extension_src = file_src.split(".")
        src_path = init_path + "/" + file_src

        file_ref = obj["reference"]
        _, extension_ref = file_ref.split(".")
        ref_path = init_path + "/" + file_ref

        file_out = obj["output"]
        _, extension_out = file_out.split(".")
        out_path = init_path + "/" + file_out


        response["service"] = "evaluation"
        response["enabled"] = "true"
        response["data"] = {}


        # Evaluation only for images
        if (extension_out == "jpg" or extension_out == "png") and (extension_ref == "jpg" or extension_ref == "png") and (extension_src == "jpg" or extension_src == "png"):
            src_img = Image(file_path=src_path)
            ref_img = Image(file_path=ref_path)
            out_img = Image(file_path=out_path)


            # get all metrics and add to response["data"]
            cte = ColorTransferEvaluation(src_img, ref_img, out_img)
            metrics = ColorTransferEvaluation.get_available_metrics()
            #metrics = ["NIQE"]
            for mm in metrics:
                evalval = cte.apply(mm)
                if np.isinf(evalval) or np.isnan(evalval):
                    response["data"][mm] = 99999
                else:
                    response["data"][mm] = evalval
        else:
            response["enabled"] = "false"

        return_dict[0] = response
        #return response
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def evaluation_subprocess(obj, init_path, response):
        pass
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def color_transfer(obj, init_path, response, return_dict):
        export_type = ""

        file_src = obj["source"]
        file_ref = obj["reference"]
        file_out = obj["output"]

        print("--------------------------------")
        print(file_src)
        print(file_ref)
        print(file_out)
        print("--------------------------------")


        approach = obj["approach"]
        _, extension_src = file_src.split(".")

        # check if file_ref is image path (string) or a list of colors (array)
        if type(file_ref) is str:
            _, extension_ref = file_ref.split(".")
            ref_path = init_path + "/" + file_ref
            file_ref_path_no_ext, file_ext = ref_path.split(".")
        else:
            extension_ref = "palette"

        src_path = init_path + "/" + file_src

        # check file extension
        file_src_path_no_ext, file_ext = src_path.split(".")
        if extension_src == "png" or extension_src == "jpg":
            src = Image(file_path=src_path)
            extension_out = "png"
            export_type = "Image"
        elif extension_src == "mp4":
            src = Video(file_path=src_path)
            extension_out = "mp4"
            export_type = "Video"
        

        if extension_ref == "png" or extension_ref == "jpg":
            ref = Image(file_path=ref_path)
        elif extension_ref == "palette":
            palette = file_ref
            palette_img = np.ones((512, 512, 3))
            width_start = 0
            width_offset = 512 // len(palette)
            for i in range(len(palette)):
                h = palette[i].lstrip('#')
                t = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
                if i == len(palette) - 1:
                    width_end = 512
                else:
                    width_end = width_start+width_offset
                palette_img[:,width_start:width_end] = t
                width_start += width_offset
            ref = Image(array=palette_img.astype("float32"), color="BGR")

        # differentiate between pointclouds and triangle meshes
        # meshes also have a mtl and a png file with the same name in the same folder
        if extension_src == "obj" or extension_src == "ply":
            file_path = os.path.join(os.getcwd(), src_path)
            fp_no_ext = os.path.join(os.getcwd(), file_src_path_no_ext)

            image_path = fp_no_ext + ".png"
            material_path = fp_no_ext + ".mtl"
            if os.path.isfile(image_path) and os.path.isfile(material_path):
                src = Mesh(file_path=file_path, datatype="Mesh")
                extension_out = "obj"
                export_type = "Mesh"
            else:
                src = Mesh(file_path=file_path, datatype="PointCloud")
                extension_out = "ply"
                export_type = "PointCloud"
        elif extension_src == "volu":
            f_name = file_src_path_no_ext.split("/")[-1]
            fold_path = os.path.dirname(file_src_path_no_ext)
            src = VolumetricVideo(folder_path=fold_path, file_name=f_name)
            extension_out = "volu"
            export_type = "VolumetricVideo"
            print("Volume: " + src_path)
            print("Volume: " + file_src_path_no_ext)

        # differentiate between pointclouds and triangle meshes
        # meshes also have a mtl and a png file with the same name in the same folder
        if extension_ref == "obj" or extension_ref == "ply":
            file_path = os.path.join(os.getcwd(), ref_path)
            fp_no_ext = os.path.join(os.getcwd(), file_ref_path_no_ext)

            image_path = fp_no_ext + ".png"
            material_path = fp_no_ext + ".mtl"
            if os.path.isfile(image_path) and os.path.isfile(material_path):
                ref = Mesh(file_path=file_path, datatype="Mesh")
            else:
                ref = Mesh(file_path=file_path, datatype="PointCloud")

        print("Source: " + src_path)
        ct = ColorTransfer(src, ref, approach)
        ct.set_options(obj["options"])



        response["service"] = "color_transfer"

        #try:
        response["enabled"] = "true"

        output = func_timeout.func_timeout(240, ct.apply, args=(), kwargs=None)

        if output["status_code"] == -1:
            response["enabled"] = "false"
            response["data"]["message"] = output["response"]
            return_dict[0] = response
            return


        print(extension_out)
        if export_type == "PointCloud":
            print("Write PointCloud:")
            print(init_path + "/" + file_out + ".ply")
            # out_loader = PLYLoader(mesh=output["object"])
            out_loader = output["object"]
            #out_loader.write(init_path + "/" + file_out + ".ply")
            out_loader.write(init_path + "/" + file_out)
            response["data"]["extension"] = "ply"
        elif export_type == "Mesh":
            print("Write File:")
            output_folder, out_filename = file_out.split("/")
            print(init_path + "/" + file_out + ".obj")
            path = init_path + "/" + output_folder + "/" "$mesh$" + out_filename
            os.mkdir(path)
            # out_loader = PLYLoader(mesh=output["object"])
            out_loader = output["object"]
            #out_loader.write(path + "/" + out_filename + ".obj")
            out_loader.write(path + "/" + out_filename)
            response["data"]["extension"] = "obj"
        elif export_type == "VolumetricVideo":
            print("Write File:")
            output_folder, out_filename = file_out.split("/")
            #print(init_path + "/" + file_out + ".obj")
            path = init_path + "/" + output_folder + "/" "$volumetric$" + out_filename
            print(path)
            print(len(output["object"].get_meshes()))
            os.mkdir(path)
            out_loader = output["object"]
            out_loader.write(path)
            response["data"]["extension"] = "volu"
        elif export_type == "Image":
            print("Write File:")
            print(init_path + "/" + file_out + ".png")
            #output["object"].write(init_path + "/" + file_out + ".png")
            output["object"].write(init_path + "/" + file_out)
            response["data"]["extension"] = "png"
        elif export_type == "Video":
            print("Write File:")
            print(init_path + "/" + file_out + ".mp4")
            output["object"].write(init_path + "/" + file_out)
            response["data"]["extension"] = "mp4"
        # except func_timeout.FunctionTimedOut:
        #     response["enabled"] = "false"
        #     response["data"]["message"] = "Algorithms takes longer than 4 minute. Change the Configuration parameters to reduce execution time."
        #     print("\033[92m" + "Request fulfilled" + "\033[0m")

        return_dict[0] = response
        #return response

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def color_histogram(server, init_path, response):
        fpath = server.getJson()["object_path"]
        # check file extension
        file_path_no_ext, file_ext = fpath.split(".")
        if file_ext == "png" or file_ext == "jpg":
            src = Image(file_path=fpath)

        # differentiate between pointclouds and triangle meshes
        # meshes also have a mtl and a png file with the same name in the same folder
        elif file_ext == "obj" or file_ext == "ply":
            file_path = os.path.join(os.getcwd(), fpath)
            fp_no_ext = os.path.join(os.getcwd(), file_path_no_ext)

            image_path = fp_no_ext + ".png"
            material_path = fp_no_ext + ".mtl"
            if os.path.isfile(image_path) and os.path.isfile(material_path):
                src = Mesh(file_path=file_path, datatype="Mesh")
            else:
                src = Mesh(file_path=file_path, datatype="PointCloud")
                
        else:
            data = "FUUHII"

        response["service"] = "color_histogram"
        response["enabled"] = "true"
        response["data"] = {
            "histogram": src.get_color_statistic()[0].tolist(),
            "mean": src.get_color_statistic()[1].tolist(),
            "std": src.get_color_statistic()[2].tolist(),
            "distribution": src.get_color_distribution().tolist()
        }
        return response
       # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def color_distribution(server, init_path, response):
        fpath = server.getJson()["object_path"]

        # check file extension
        file_path_no_ext, file_ext = fpath.split(".")
        if file_ext == "png" or file_ext == "jpg":
            src = Image(file_path=fpath)

        # differentiate between pointclouds and triangle meshes
        # meshes also have a mtl and a png file with the same name in the same folder
        elif file_ext == "obj" or file_ext == "ply":
            file_path = os.path.join(os.getcwd(), fpath)
            fp_no_ext = os.path.join(os.getcwd(), file_path_no_ext)

            image_path = fp_no_ext + ".png"
            material_path = fp_no_ext + ".mtl"
            if os.path.isfile(image_path) and os.path.isfile(material_path):
                src = Mesh(file_path=file_path, datatype="Mesh")
            else:
                src = Mesh(file_path=file_path, datatype="PointCloud")
        else:
            data = "FUUHII"

        response["service"] = "color_distribution"
        response["enabled"] = "true"
        response["data"] = {
            "distribution": src.get_color_distribution().tolist()
        }
        return response 
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def object_info(server, init_path, response):
        # initial data to send
        sent_data = {
            "histogram": -1,
            "voxelgrid_centers": -1,
            "voxelgrid_colors": -1,
            "scale":-1,
            "height": -1,               # only images
            "width": -1,                # only images
            "channels": -1,             # only images
            "num_faces": -1,            # only meshes
            "trianglenormals": -1,      # only meshes
            "num_vertices": -1,         # only pointclouds and meshes
            "vertexcolors": -1,         # only pointclouds and meshes
            "vertexnormals": -1,        # only pointclouds and meshes
        }

        json_obj = server.getJson()
        obj = json_obj["object_path"]

        # check file extension
        file_path_no_ext, file_ext = obj.split(".")
        if file_ext == "png" or file_ext == "jpg":
            file_path = os.path.join(os.getcwd(), obj)
            print(file_path)
            img = cv2.imread(file_path)
            sent_data["height"] = img.shape[0]
            sent_data["width"] = img.shape[1]
            sent_data["channels"] = img.shape[2]

            src = Image(file_path=obj)
            sent_data["histogram"] = src.get_3D_color_histogram().tolist()

        # differentiate between pointclouds and triangle meshes
        # meshes also have a mtl and a png file with the same name in the same folder
        elif file_ext == "obj" or file_ext == "ply":
            file_path = os.path.join(os.getcwd(), obj)
            fp_no_ext = os.path.join(os.getcwd(), file_path_no_ext)

            image_path = fp_no_ext + ".png"
            material_path = fp_no_ext + ".mtl"
            if os.path.isfile(image_path) and os.path.isfile(material_path):
                mesh = Mesh(file_path=file_path, datatype="Mesh")
                sent_data["num_vertices"] = mesh.get_num_vertices()
                sent_data["num_faces"] = mesh.get_num_faces()
                sent_data["vertexcolors"] = "yes" if mesh.has_vertex_colors() else "no"
                sent_data["vertexnormals"] = "yes" if mesh.has_vertex_normals() else "no"
                sent_data["trianglenormals"] = "yes" if mesh.has_face_normals() else "no"

                sent_data["histogram"] = mesh.get_3D_color_histogram().tolist()

                # mesh = o3d.io.read_triangle_mesh(file_path)
                # sent_data["num_vertices"] = np.asarray(mesh.vertices).shape[0]
                # sent_data["num_faces"] = np.asarray(mesh.triangles).shape[0]
                # sent_data["vertexcolors"] = "yes" if np.asarray(mesh.vertex_colors).shape[0] != 0 else "no"
                # sent_data["vertexnormals"] = "yes" if np.asarray(mesh.vertex_normals).shape[0] != 0 else "no"
                # sent_data["trianglenormals"] = "yes" if np.asarray(mesh.triangle_normals).shape[0] != 0 else "no"
       
            else:
                mesh = Mesh(file_path=file_path, datatype="PointCloud")
                sent_data["num_vertices"] = mesh.get_num_vertices()
                sent_data["vertexcolors"] = "yes" if mesh.has_vertex_colors() else "no"
                sent_data["vertexnormals"] = "yes" if mesh.has_vertex_normals() else "no"

                sent_data["histogram"] = mesh.get_3D_color_histogram().tolist()

                # pcd = o3d.io.read_point_cloud(file_path)
                # sent_data["num_vertices"] = np.asarray(pcd.points).shape[0]
                # sent_data["vertexcolors"] = "yes" if np.asarray(pcd.colors).shape[0] != 0 else "no"
                # sent_data["vertexnormals"] = "yes" if np.asarray(pcd.normals).shape[0] != 0 else "no"

                voxel_level = json_obj["voxel_level"]
                voxelgrid = mesh.get_voxel_grid(voxel_level)
                sent_data["voxelgrid_centers"] = voxelgrid["centers"].tolist()
                sent_data["voxelgrid_colors"] = voxelgrid["colors"].tolist()
                sent_data["scale"] = voxelgrid["scale"]
        else:
            data = "FUUHII"

        response["service"] = "object_info"
        response["enabled"] = "true"
        response["data"] = sent_data
        return response

    
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def upload(server):
        # Save files received in the POST
        wasSuccess, files_uploaded = PostRequest.handle_file_uploads(server)
        print(wasSuccess)

        # Compose a response to the client
        response_obj = {
            "wasSuccess": wasSuccess,
            "files_uploaded": files_uploaded,
            "client_address": server.client_address
        }

        response_str = json.dumps(response_obj)

        server.log_message(response_str)

        # Send our response code, header, and data
        server.send_response(200)
        server.send_header("Content-type", "Application/json")
        server.send_header("Content-Length", len(response_str))
        server.end_headers()
        server.wfile.write(response_str.encode('utf-8'))

    # ------------------------------------------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------------------------------------------
    # method description
    # ------------------------------------------------------------------------------------------------------------------
    @staticmethod
    def handle_file_uploads(server):
        """
        Take the post request and save any files received to the same folder
        as this script.
        Returns
            wasSuccess: bool: whether the process was a success
            files_uploaded: list of string: files that were created
        """
        server.char_remaining = int(server.headers['content-length'])
        # Find the boundary from content-type, which might look like:
        # 'multipart/form-data; boundary=----WebKitFormBoundaryUI1LY7c2BiEKGfFk'
        boundary = server.headers['content-type'].split("=")[1]

        basepath = server.translate_path(server.path)
        # Strip this script's name from the path so it's just a folder
        basepath = os.path.dirname(basepath)

        # ----WebKitFormBoundaryUI1LY7c2BiEKGfFk
        line_str = server.read_line()
        if not boundary in line_str:
            print("Content did NOT begin with boundary as it should")
            return False, []

        files_uploaded = []
        while server.char_remaining > 0:
            # Breaking out of this loop on anything except a boundary
            # an end-of-file will be a failure, so let's assume that
            wasSuccess = False

            # Content-Disposition: form-data; name="file"; filename="README.md"
            line_str = server.read_line()
            filename = re.findall('Content-Disposition.*name="file"; ' +
                                  'filename="(.*)"', line_str)
            if not filename:
                server.log_message("Can't find filename " + filename)
                break
            else:
                filename = filename[0]
            filepath = os.path.join(basepath, "data/Uploads/" + filename)
            try:
                outfile = open(filepath, 'wb')
            except IOError:
                server.log_message("Can't create file " + str(filepath) +
                                 " to write; do you have permission to write?")
                break

            # Content-Type: application/octet-stream
            line_str = server.read_line()

            # Blank line
            line_str = server.read_line()

            # First real line of code
            preline = server.read_line()
            # Loop through the POST until we find another boundary line,
            # signifying the end of this file and the possible start of another
            while server.char_remaining > 0:
                line_str = server.read_line()

                # ----WebKitFormBoundaryUI1LY7c2BiEKGfFk
                if boundary in line_str:
                    preline = preline[0:-1]
                    if preline.endswith('\r'):
                        preline = preline[0:-1]
                    outfile.write(preline.encode('ISO-8859-1'))
                    outfile.close()
                    server.log_message("File '%s' upload success!" % filename)
                    files_uploaded.append(filename)
                    # If this was the last file, the session was a success!
                    wasSuccess = True
                    break
                else:
                    outfile.write(preline.encode('ISO-8859-1'))
                    preline = line_str

        filepath = os.path.join(basepath, "data/Uploads/" + filename)
        folderpath = os.path.join(basepath, "data/Uploads")
        # check if file is a zip file -> means that a mesh is uploaded and has to be extracted
        ext = filepath.split(".")[-1]
        if ext == "zip":
            # loading the temp.zip and creating a zip object
            with ZipFile(filepath, 'r') as zObject:
                # Extracting all the members of the zip 
                # into a specific location.
                zObject.extractall(path=folderpath)
            os.remove(filepath)

        return wasSuccess, files_uploaded