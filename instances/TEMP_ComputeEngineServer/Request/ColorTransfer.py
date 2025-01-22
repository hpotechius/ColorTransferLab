import sys
# import os
# import func_timeout
# import json
# import re
# import numpy as np
# import cv2
# import open3d as o3d
# from zipfile import ZipFile
# import gc

# from ColorTransferLib.ColorTransfer import ColorTransfer
# from ColorTransferLib.MeshProcessing.PLYLoader import PLYLoader
# from ColorTransferLib.MeshProcessing.Mesh2 import Mesh2
# from ColorTransferLib.ImageProcessing.Image import Image

  
# def color_transfer(server, init_path, response):
#         export_type = ""
#         obj = server.getJson()

#         file_src = obj["source"]
#         file_ref = obj["reference"]
#         file_out = obj["output"]
#         approach = obj["approach"]
#         _, extension_src = file_src.split(".")

#         # check if file_ref is image path (string) or a list of colors (array)
#         if type(file_ref) is str:
#             _, extension_ref = file_ref.split(".")
#             ref_path = init_path + "/" + file_ref
#             file_ref_path_no_ext, file_ext = ref_path.split(".")
#         else:
#             extension_ref = "palette"

#         src_path = init_path + "/" + file_src

#         # check file extension
#         file_src_path_no_ext, file_ext = src_path.split(".")
#         if extension_src == "png" or extension_src == "jpg":
#             src = Image(file_path=src_path)
#             extension_out = "png"
#             export_type = "Image"
        

#         if extension_ref == "png" or extension_ref == "jpg":
#             ref = Image(file_path=ref_path)
#         elif extension_ref == "palette":
#             palette = file_ref
#             palette_img = np.ones((512, 512, 3))
#             width_start = 0
#             width_offset = 512 // len(palette)
#             for i in range(len(palette)):
#                 h = palette[i].lstrip('#')
#                 t = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
#                 if i == len(palette) - 1:
#                     width_end = 512
#                 else:
#                     width_end = width_start+width_offset
#                 palette_img[:,width_start:width_end] = t
#                 width_start += width_offset
#             ref = Image(array=palette_img.astype("float32"), color="BGR")

#         # differentiate between pointclouds and triangle meshes
#         # meshes also have a mtl and a png file with the same name in the same folder
#         if extension_src == "obj" or extension_src == "ply":
#             file_path = os.path.join(os.getcwd(), src_path)
#             fp_no_ext = os.path.join(os.getcwd(), file_src_path_no_ext)

#             image_path = fp_no_ext + ".png"
#             material_path = fp_no_ext + ".mtl"
#             if os.path.isfile(image_path) and os.path.isfile(material_path):
#                 src = Mesh2(file_path=file_path, datatype="Mesh")
#                 extension_out = "obj"
#                 export_type = "Mesh"
#             else:
#                 src = Mesh2(file_path=file_path, datatype="PointCloud")
#                 extension_out = "ply"
#                 export_type = "PointCloud"

#         # differentiate between pointclouds and triangle meshes
#         # meshes also have a mtl and a png file with the same name in the same folder
#         if extension_ref == "obj" or extension_ref == "ply":
#             file_path = os.path.join(os.getcwd(), ref_path)
#             fp_no_ext = os.path.join(os.getcwd(), file_ref_path_no_ext)

#             image_path = fp_no_ext + ".png"
#             material_path = fp_no_ext + ".mtl"
#             if os.path.isfile(image_path) and os.path.isfile(material_path):
#                 ref = Mesh2(file_path=file_path, datatype="Mesh")
#             else:
#                 ref = Mesh2(file_path=file_path, datatype="PointCloud")


#         ct = ColorTransfer(src, ref, approach)
#         ct.set_options(obj["options"])
#         # output = ct.apply()
        
#         python_bin = os.path.dirname(os.path.abspath(__file__)) + "/../env/bin/python"
#         # Path to the script that must run under the virtualenv
#         script_file = "Request/ColorTransfer.py"
#         p = subprocess.Popen([python_bin, script_file], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

#         stdout, stderr = p.communicate()

#         # Den Rückgabewert ausgeben
#         print("Standardausgabe:", stdout.decode())
#         print("Fehlerausgabe:", stderr.decode())
#         print("Rückgabewert:", p.returncode)

#         response["service"] = "color_transfer"

#         try:
#             response["enabled"] = "true"

#             output = func_timeout.func_timeout(240, ct.apply, args=(), kwargs=None)


#             if output["status_code"] == -1:
#                 response["enabled"] = "false"
#                 response["data"]["message"] = output["response"]
#                 return response


#             print(extension_out)
#             if export_type == "PointCloud":
#                 print("Write PointCloud:")
#                 print(init_path + "/" + file_out + ".ply")
#                 # out_loader = PLYLoader(mesh=output["object"])
#                 out_loader = output["object"]
#                 out_loader.write(init_path + "/" + file_out + ".ply")
#                 response["data"]["extension"] = "ply"
#             elif export_type == "Mesh":
#                 print("Write File:")
#                 output_folder, out_filename = file_out.split("/")
#                 print(init_path + "/" + file_out + ".obj")
#                 path = init_path + "/" + output_folder + "/" "$mesh$" + out_filename
#                 os.mkdir(path)
#                 # out_loader = PLYLoader(mesh=output["object"])
#                 out_loader = output["object"]
#                 out_loader.write(path + "/" + out_filename + ".obj")
#                 response["data"]["extension"] = "obj"
#             elif export_type == "Image":
#                 print("Write File:")
#                 print(init_path + "/" + file_out + ".png")
#                 output["object"].write(init_path + "/" + file_out + ".png")
#                 response["data"]["extension"] = "png"
#         except func_timeout.FunctionTimedOut:
#             response["enabled"] = "false"
#             response["data"]["message"] = "Algorithms takes longer than 4 minute. Change the Configuration parameters to reduce execution time."
#             print("\033[92m" + "Request fulfilled" + "\033[0m")

#         return response

#colorTransfer()
script_args = sys.argv[1:]

sys.stdout.write(script_args[0])