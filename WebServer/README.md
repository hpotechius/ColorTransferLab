---
title: ColorTransferLab Frontend
emoji: 🎨
colorFrom: indigo
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# ColorTransferLab Frontend

Web frontend for the ColorTransferLab application.

The local Vite development path remains `/ColorTransferLab/`. The Hugging Face
Space is built and served at the domain root.

WebRTC is preferred for ComputeNode connections. If ICE negotiation fails,
the frontend automatically falls back to a Socket.IO/WebSocket relay through
the configured signal server. The signal server must therefore remain
reachable by both the frontend and the ComputeNode.
