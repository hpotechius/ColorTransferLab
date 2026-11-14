"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import torch
import numpy as np
from PIL import Image as PILImage
from ColorTransferLib.DataTypes.Image import Image
from utils.utils import Utils

try:
    from sam3.model_builder import build_sam3_image_model
    from sam3.model.sam3_image_processor import Sam3Processor
    SAM3_IMPORT_ERROR = None
except ImportError as error:
    build_sam3_image_model = None
    Sam3Processor = None
    SAM3_IMPORT_ERROR = error

# ------------------------------------------------------------------------------------------------------------------
# Converts a hex color string (e.g., "#RRGGBB") to a BGR tuple.
# ------------------------------------------------------------------------------------------------------------------
def hex_to_bgr(hex_str):
    h = hex_str.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"Invalid hex color '{hex_str}', expected 6 hex digits.")
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return (b, g, r)

# ------------------------------------------------------------------------------------------------------------------
# Performs semantic segmentation on the input image.
# ------------------------------------------------------------------------------------------------------------------
def segment(client, input_image, segment_classes):
    if SAM3_IMPORT_ERROR is not None:
        raise RuntimeError(
            "SAM3 segmentation is unavailable in this Python environment. "
            "Install SAM3 with its Linux/CUDA dependencies, including Triton, "
            "on a supported Linux/NVIDIA system."
        ) from SAM3_IMPORT_ERROR


    # ======================================
    # 26 Klassen + Farben
    # ======================================

    CLASSES = {
        # "wall":                 {"id": 1,  "color": (0, 0, 255)},
        # "floor":                {"id": 2,  "color": (0, 255, 0)},
        # "wooden floor":                {"id": 22,  "color": (0, 255, 0)},
        # "ceiling":              {"id": 3,  "color": (255, 0, 0)},
        # "window":               {"id": 4,  "color": (255, 255, 0)},
        # "window frame":         {"id": 42,  "color": (255, 255, 0)},
        # "door":                 {"id": 5,  "color": (0, 255, 255)},
        # "room door":            {"id": 52,  "color": (0, 255, 255)},
        # "wooden door":          {"id": 53,  "color": (0, 255, 255)},
        # "stucco":               {"id": 6,  "color": (255, 0, 255)},
        # "ceiling molding":      {"id": 62,  "color": (255, 0, 255)},
        # "skirting":             {"id": 7,  "color": (221, 221, 221)},
        # "baseboard":            {"id": 72,  "color": (221, 221, 221)},
        # "fireplace":            {"id": 8,  "color": (170, 85, 0)},
        # "fireplace mantel":     {"id": 82,  "color": (170, 85, 0)},
        # "outside":              {"id": 9,  "color": (85, 85, 85)},

        # "table":                {"id": 10, "color": (255, 0, 170)},
        # "counter":              {"id": 102, "color": (255, 0, 170)},
        # "counter top":          {"id": 103, "color": (255, 0, 170)},
        # "side table":          {"id": 104, "color": (255, 0, 170)},
        # "island":          {"id": 105, "color": (255, 0, 170)},
        # "seat":                 {"id": 11, "color": (170, 0, 255)},
        # "stool":                {"id": 112, "color": (170, 0, 255)},
        # "sofa":                 {"id": 12, "color": (255, 85, 0)},
        # "cabinet":              {"id": 13, "color": (85, 0, 255)},
        # "wall cabinet":         {"id": 132, "color": (85, 0, 255)},
        # "sideboard":         {"id": 133, "color": (85, 0, 255)},
        # "overhead cabinet":     {"id": 134, "color": (85, 0, 255)},
        # "bottle rack":     {"id": 135, "color": (85, 0, 255)},
        # "bed":                  {"id": 14, "color": (0, 170, 255)},
        # "lamp":                 {"id": 15, "color": (255, 170, 0)},
        # "light":                {"id": 152, "color": (255, 170, 0)},
        # "floor lamp":           {"id": 153, "color": (255, 170, 0)},
        # "ceiling lamp":           {"id": 154, "color": (255, 170, 0)},
        # "light fixture":           {"id": 155, "color": (255, 170, 0)},
        # "curtain":              {"id": 16, "color": (157, 173, 52)},
        # "carpet":               {"id": 17, "color": (85, 0, 170)},
        # "instrument":           {"id": 18, "color": (241, 148, 138)},
        # "piano":                {"id": 182, "color": (241, 148, 138)},
        # "appliance":            {"id": 19, "color": (104, 10, 0)},
        # "sink":                 {"id": 192, "color": (104, 10, 0)},
        # "tap":                 {"id": 193, "color": (104, 10, 0)},
        # "oven":                 {"id": 194, "color": (104, 10, 0)},

        # "book":                 {"id": 20, "color": (170, 255, 0)},
        # "picture":              {"id": 21, "color": (255, 0, 85)},
        # "container":            {"id": 22, "color": (0, 85, 255)},
        # "bowl":                 {"id": 222, "color": (0, 85, 255)},
        # "vase":                 {"id": 223, "color": (0, 85, 255)},
        # "plate":                {"id": 224, "color": (0, 85, 255)},
        # "glass":                {"id": 225, "color": (0, 85, 255)},
        # "bottle":               {"id": 226, "color": (0, 85, 255)},
        # "kettle":               {"id": 227, "color": (0, 85, 255)},
        # "cup":               {"id": 228, "color": (0, 85, 255)},
        # "plant":                {"id": 23, "color": (170, 255, 170)},
        # "cushion":              {"id": 24, "color": (102, 130, 148)},
        # "blanket":              {"id": 25, "color": (170, 85, 255)},
        # "deco":                 {"id": 26, "color": (255, 170, 170)},
        # "candle":               {"id": 262, "color": (255, 170, 170)},
        # "bird":                 {"id": 263, "color": (255, 170, 170)},
        # "candle holder":         {"id": 264, "color": (255, 170, 170)},
        # "decoration":           {"id": 265, "color": (255, 170, 170)},
        "sky":           {"id": 27, "color": (255, 0, 0)},
        "grass":           {"id": 28, "color": (0, 255, 0)},
        "person":           {"id": 29, "color": (0, 0, 255)},
        "cat":           {"id": 30, "color": (0, 0, 255)},
    }

    # ======================================
    # Load SAM3 model
    # ======================================
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    Utils.printINFO(f"Loading SAM3 model on {DEVICE}...", client.window)
    model = build_sam3_image_model().to(DEVICE)
    processor = Sam3Processor(model)

    # ======================================
    # Load image
    # ======================================
    in_image_np = input_image.get_raw() * 255
    print("raw shape from ColorTransferLib:", in_image_np.shape)

    # Ensure we have a Numpy array
    if not isinstance(in_image_np, np.ndarray):
        in_image_np = np.array(in_image_np)

    # Cast to uint8 (0–255) - here we assume the values are already in the appropriate range
    if in_image_np.dtype != np.uint8:
        in_image_np = in_image_np.astype(np.uint8)

    # Convert Numpy array to PIL Image (expects HWC format)
    in_image = PILImage.fromarray(in_image_np)
    W, H = in_image.size
    Utils.printINFO(f"Input image loaded: {W}x{H} pixels", client.window)

    # Prepare maps for whole image
    semantic_output = np.zeros((H, W, 3), dtype=np.uint8)
    score_map = np.zeros((H, W), dtype=np.float32)

    for segment in segment_classes:
        if segment["enabled"]:
            Utils.printINFO(f"Finding objects of class: '{segment['name']}'", client.window)

            # 1) Encode image
            with torch.autocast("cuda", dtype=torch.bfloat16):
                inference_state = processor.set_image(in_image)

                # 2) Pass text prompt
                output = processor.set_text_prompt(
                    state=inference_state,
                    prompt=segment["name"]
                )

            masks = output["masks"]      # (N,1,H,W)
            print(f" → Masks shape: {masks.shape if masks is not None else None}")
            scores = output["scores"]    # (N)

            if masks is None or len(masks) == 0:
                print(" → No detections.")
                continue

            print(f" → Found {len(masks)} instance(s)")

            # segment["color"] should be expected as a hex string, e.g. "#FF0000"
            class_color = hex_to_bgr(segment["color"])

            # ======================================
            # Pixel-level highest-score selection
            # ======================================
            for i, (mask, score) in enumerate(zip(masks, scores)):
                if score < 0.5:
                    continue

                print(f"   Instance {i} — score={score:.3f}")

                mask_bin = (mask.squeeze(0).cpu().numpy() > 0.5)

                # Mask contains only the area where THIS instance claims ownership
                s = float(score)   # Extract float once
                update_pixels = mask_bin & (s > score_map)

                # Update the winning score
                score_map[update_pixels] = s

                # Update semantic label ONLY where this instance wins
                semantic_output[update_pixels] = class_color

    # ======================================
    # Save output image
    # ======================================
    out_img = Image(array=semantic_output)

    Utils.printINFO(f"Calculated semantic segmentation", client.window)

    return out_img

