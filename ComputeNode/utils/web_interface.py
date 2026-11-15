"""Browser interface for the ComputeNode.

The class intentionally exposes the same state and callback methods that the
WebRTC client uses with the Qt interface.
"""

import asyncio
import html
import json
import os
import secrets
import subprocess
from datetime import datetime
from functools import wraps
from hmac import compare_digest

from aiohttp import web

from utils.utils import Utils


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ColorTransferLab - ComputeNode</title>
<style>
:root { color-scheme: dark; }
body { margin: 0; padding: 18px; background: #353535; color: #fff;
       font: 14px sans-serif; }
main { display: grid; grid-template-columns: minmax(420px, 1fr) minmax(420px, 1fr);
       gap: 18px; max-width: 1200px; margin: auto; }
section { border: 1px solid #777; padding: 14px; margin-bottom: 14px; }
h1, h2 { margin: 0 0 10px; font-size: 18px; }
h2 { font-size: 16px; }
.row { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 10px;
       align-items: center; min-height: 31px; }
label { color: #bbb; }
#database_path { min-width: 0; overflow: hidden; text-overflow: ellipsis;
                 white-space: nowrap; display: block; }
input, button, select { box-sizing: border-box; width: 100%; padding: 7px;
                         background: #232323; color: #fff; border: 1px solid #777; }
button { cursor: pointer; margin-top: 8px; }
.buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.buttons button {
  border-color: #888;
  transition: background-color 140ms ease, border-color 140ms ease,
              box-shadow 140ms ease, transform 80ms ease;
}
.buttons button:hover,
.buttons button:focus-visible {
  background: #315b7d;
  border-color: #6db7f2;
  box-shadow: 0 0 10px rgba(109, 183, 242, 0.65);
  outline: none;
}
.buttons button:active,
.buttons button.is-active {
  background: #4a87b8;
  border-color: #a9dcff;
  box-shadow: 0 0 14px rgba(109, 183, 242, 0.9);
  transform: translateY(1px);
}
#terminal { height: 565px; overflow: auto; white-space: pre-wrap; background: #232323;
            padding: 10px; color: #ddd; }
.terminal-line { display: block; }
.terminal-info { color: orange; }
.terminal-recv { color: lightblue; }
.terminal-send { color: lightgreen; }
.terminal-warn { color: #ff6666; }
.online, .connected { color: #55d66f; }
.offline { color: #f66; }
.idle { color: #e6d84a; }
@media (max-width: 850px) {
  main { grid-template-columns: 1fr; }
  #terminal { height: 280px; }
}
</style>
</head>
<body>
<main>
<div>
<h1>ColorTransferLab - ComputeNode</h1>
<section><h2>General Information</h2>
<div class="row"><label>Database Path:</label><span id="database_path" title=""></span></div>
<div class="row"><label>ColorTransferLib Version:</label><span id="ctl_version"></span></div>
</section>
<section><h2>Signal Server Information</h2>
<div class="row"><label>URL:</label><input id="signal_server"></div>
<div class="row"><label>Status:</label><span id="signal_status"></span></div>
</section>
<section><h2>Compute Node Information</h2>
<div class="row"><label>Name:</label><input id="node_name"></div>
<div class="row"><label>IP Address:</label><span id="node_ip">null</span></div>
<div class="row"><label>ID:</label><span id="node_id">null</span></div>
<div class="row"><label>Status:</label><span id="node_status"></span></div>
<div class="row"><label>Private:</label><input id="private" type="checkbox"></div>
<div class="row"><label>Password:</label><input id="privacy_password" type="password"></div>
</section>
<section><h2>Client Information</h2>
<div class="row"><label>Name:</label><select id="client_name"></select></div>
<div class="row"><label>IP Address:</label><span id="client_ip">null</span></div>
<div class="row"><label>ID:</label><span id="client_id">null</span></div>
<div class="row"><label>Status:</label><span id="client_status">null</span></div>
</section>
<section><h2>TURN Server Information</h2>
<div class="row"><label>Address:</label><input id="turn_name"></div>
<div class="row"><label>User:</label><input id="turn_user"></div>
<div class="row"><label>Password:</label><input id="turn_password" type="password"></div>
</section>
<div class="buttons"><button onclick="updateSettings(event)">Apply Settings</button>
<button onclick="connect(event)">Connect to Signal Server</button>
<button onclick="initDatabase(event)">Init User Study Database</button></div>
</div>
<section><h2>Terminal</h2><div id="terminal"></div>
<div id="progress"></div></section>
</main>
<script>
const $ = id => document.getElementById(id);
let selectedClient = "";
function setValue(id, value) { $(id).value = value ?? ""; }
function setText(id, value) {
  const element = $(id);
  element.textContent = value ?? "null";
  element.className = "";
  const status = String(value ?? "").toLowerCase();
  if (status === "connected" || status === "online") element.className = "connected";
  if (status === "idle") element.className = "idle";
  if (status === "offline") element.className = "offline";
}
async function state() {
  const response = await fetch("/api/state");
  const data = await response.json();
  setText("database_path", data.database_path);
  $("database_path").title = data.database_path ?? "";
  setText("ctl_version", data.ctl_version);
  setValue("signal_server", data.signal_server);
  setText("signal_status", data.signal_server_status);
  setValue("node_name", data.compute_node_name);
  setText("node_ip", data.compute_node_ip);
  setText("node_id", data.compute_node_id);
  setText("node_status", data.compute_node_status);
  $("private").checked = data.compute_node_privacy;
  setValue("privacy_password", data.compute_node_privacy_pw);
  setValue("turn_name", data.turn_name); setValue("turn_user", data.turn_user);
  setValue("turn_password", data.turn_pw);
  const names = Object.keys(data.connections_data);
  if (!names.includes(selectedClient)) selectedClient = names[0] || "";
  $("client_name").innerHTML = names.map(name =>
    `<option>${name.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</option>`).join("");
  $("client_name").value = selectedClient;
  const client = data.connections_data[selectedClient] || {};
  setText("client_ip", client.ip_address); setText("client_id", client.id);
  setText("client_status", client.status);
  const terminal = $("terminal");
  const atBottom = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight <= 2;
  terminal.replaceChildren(...data.terminal.map(entry => {
    const line = document.createElement("span");
    line.className = `terminal-line terminal-${entry.type || "info"}`;
    line.textContent = entry.text;
    return line;
  }));
  if (atBottom) terminal.scrollTop = terminal.scrollHeight;
  $("progress").textContent = data.progress === null ? "" : `Progress: ${data.progress}%`;
}
async function post(path, body = {}, button = null) {
  if (button) button.classList.add("is-active");
  try {
    await fetch(path, {method: "POST", headers: {"Content-Type": "application/json"},
                       body: JSON.stringify(body)});
    await state();
  } finally {
    if (button) button.classList.remove("is-active");
  }
}
async function updateSettings(event) {
  await post("/api/settings", {signal_server: $("signal_server").value,
    compute_node_name: $("node_name").value, compute_node_privacy: $("private").checked,
    compute_node_privacy_pw: $("privacy_password").value, turn_name: $("turn_name").value,
    turn_user: $("turn_user").value, turn_pw: $("turn_password").value}, event.currentTarget);
}
function connect(event) { post("/api/connect", {}, event.currentTarget); }
function initDatabase(event) { post("/api/database", {}, event.currentTarget); }
$("client_name").onchange = event => { selectedClient = event.target.value; state(); };
state(); setInterval(state, 1000);
</script>
</body>
</html>"""

LOGIN_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport"
content="width=device-width, initial-scale=1"><title>ComputeNode Login</title>
<style>
body { margin: 0; padding: 18px; background: #353535; color: #fff;
       font: 14px sans-serif; } form { max-width: 360px; margin: 15vh auto;
       padding: 22px; border: 1px solid #777; } h1 { font-size: 19px; }
input, button { box-sizing: border-box; width: 100%; padding: 9px; margin-top: 9px;
                background: #232323; color: #fff; border: 1px solid #777; }
#error { color: #ff6666; min-height: 20px; }
</style></head><body><form id="login">
<h1>ColorTransferLab - ComputeNode</h1>
<input id="username" autocomplete="username" placeholder="Username" required>
<input id="password" type="password" autocomplete="current-password"
       placeholder="Password" required>
<div id="error"></div><button>Login</button></form>
<script>
document.getElementById("login").onsubmit = async event => {
  event.preventDefault();
  const usernameValue = document.getElementById("username").value;
  const passwordValue = document.getElementById("password").value;
  const response = await fetch("/login", {method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username: usernameValue, password: passwordValue})});
  if (response.ok) location.href = "/";
  else document.getElementById("error").textContent = "Invalid username or password.";
};
</script></body></html>"""


class WebInterface:
    def __init__(self, main_server, signal_server, password, host="127.0.0.1",
                 port=8080):
        self.main_server = main_server
        self.signal_server = signal_server
        self.compute_node_name = "ComputeNode-" + Utils.generate_random_string()
        self.compute_node_privacy = False
        self.compute_node_privacy_pw = password
        self.turn_name = "turn:ec2-54-164-31-23.compute-1.amazonaws.com:3478"
        self.turn_user = "testuser"
        self.turn_pw = "testpw"
        self.connections_data = {}
        self.signal_server_status = "Offline"
        self.compute_node_status = "Disconnected"
        self.compute_node_ip_address = "null"
        self.compute_node_id = "null"
        self.terminal = []
        self.progress = None
        self.progress_bar = _WebProgressBar()
        self._connection_task = None
        self._runner = None
        self.host = host
        self.port = port
        self.web_username = os.environ.get("COMPUTENODE_WEB_USERNAME", "hpotechius")
        self.web_password = os.environ.get("COMPUTENODE_WEB_PASSWORD")
        if not self.web_password:
            raise RuntimeError(
                "COMPUTENODE_WEB_PASSWORD must be set before starting web mode."
            )
        self._sessions = set()

    def _authenticated(self, request):
        token = request.cookies.get("computenode_session", "")
        return any(compare_digest(token, session) for session in self._sessions)

    def _require_auth(self, handler):
        @wraps(handler)
        async def guarded(request):
            if not self._authenticated(request):
                return web.json_response({"error": "authentication required"}, status=401)
            return await handler(request)
        return guarded

    def set_signal_server_status(self, status):
        self.signal_server_status = status

    def set_compute_node_status(self, status):
        self.compute_node_status = status

    def set_compute_node_ip_address(self, status):
        self.compute_node_ip_address = status

    def set_compute_node_id(self, status):
        self.compute_node_id = status

    def set_client_status(self, status):
        name = next(iter(self.connections_data), None)
        if name:
            self.connections_data[name]["status"] = status

    def set_client_box(self):
        if not self.connections_data:
            return

    def print_to_terminal(self, text, msg_type="info"):
        if msg_type not in {"info", "recv", "send", "warn"}:
            msg_type = "info"
        self.terminal.append({
            "text": f"[{datetime.now():%H:%M:%S}] {text}",
            "type": msg_type,
        })
        self.terminal = self.terminal[-500:]

    def update_progress_bar(self, downloaded, total_length):
        self.progress = int(downloaded / total_length * 100) if total_length else 0
        if self.progress >= 100:
            self.progress = None

    async def on_button_click(self):
        if self._connection_task is None or self._connection_task.done():
            self._connection_task = asyncio.create_task(self.main_server(self))

    async def _index(self, request):
        if not self._authenticated(request):
            return web.Response(text=LOGIN_PAGE, content_type="text/html")
        return web.Response(text=PAGE, content_type="text/html")

    async def _login(self, request):
        data = await request.json()
        username = str(data.get("username", ""))
        password = str(data.get("password", ""))
        if not (compare_digest(username, self.web_username)
                and compare_digest(password, self.web_password)):
            return web.json_response({"error": "invalid credentials"}, status=401)
        token = secrets.token_urlsafe(32)
        self._sessions.add(token)
        response = web.json_response({"ok": True})
        response.set_cookie(
            "computenode_session", token, httponly=True, samesite="Strict"
        )
        return response

    async def _logout(self, request):
        token = request.cookies.get("computenode_session", "")
        self._sessions.discard(token)
        response = web.json_response({"ok": True})
        response.del_cookie("computenode_session")
        return response

    async def _state(self, request):
        try:
            from pkg_resources import get_distribution
            version = get_distribution("ColorTransferLib").version
        except Exception:
            version = "unknown"
        data = {
            "database_path": os.path.abspath("files/data"),
            "ctl_version": version,
            "signal_server": self.signal_server,
            "signal_server_status": self.signal_server_status,
            "compute_node_name": self.compute_node_name,
            "compute_node_ip": self.compute_node_ip_address,
            "compute_node_id": self.compute_node_id,
            "compute_node_status": self.compute_node_status,
            "compute_node_privacy": self.compute_node_privacy,
            "compute_node_privacy_pw": self.compute_node_privacy_pw,
            "turn_name": self.turn_name, "turn_user": self.turn_user,
            "turn_pw": self.turn_pw, "connections_data": self.connections_data,
            "terminal": self.terminal, "progress": self.progress,
        }
        return web.json_response(data)

    async def _settings(self, request):
        data = await request.json()
        self.signal_server = data.get("signal_server", self.signal_server)
        self.compute_node_name = data.get("compute_node_name", self.compute_node_name)
        self.compute_node_privacy = bool(data.get("compute_node_privacy", False))
        self.compute_node_privacy_pw = data.get("compute_node_privacy_pw", "")
        self.turn_name = data.get("turn_name", self.turn_name)
        self.turn_user = data.get("turn_user", self.turn_user)
        self.turn_pw = data.get("turn_pw", self.turn_pw)
        return web.json_response({"ok": True})

    async def _connect(self, request):
        await self.on_button_click()
        return web.json_response({"ok": True})

    async def _database(self, request):
        self.print_to_terminal("Database initialization is only available in the Qt interface.")
        return web.json_response({"ok": False}, status=501)

    async def start(self):
        app = web.Application()
        app.router.add_get("/", self._index)
        app.router.add_post("/login", self._login)
        app.router.add_post("/logout", self._require_auth(self._logout))
        app.router.add_get("/api/state", self._require_auth(self._state))
        app.router.add_post("/api/settings", self._require_auth(self._settings))
        app.router.add_post("/api/connect", self._require_auth(self._connect))
        app.router.add_post("/api/database", self._require_auth(self._database))
        self._runner = web.AppRunner(app)
        await self._runner.setup()
        site = web.TCPSite(self._runner, self.host, self.port)
        await site.start()
        self.print_to_terminal(f"Web interface available at http://{self.host}:{self.port}")
        asyncio.create_task(Utils.download_and_extract(self))
        if self._connection_task is None or self._connection_task.done():
            self._connection_task = asyncio.create_task(self.main_server(self))
        reachable = Utils.is_address_reachable(self.signal_server)
        self.set_signal_server_status("Online" if reachable else "Offline")
        await asyncio.Event().wait()


class _WebProgressBar:
    def hide(self):
        return None
