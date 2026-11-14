
/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import { createContext, useContext, useRef } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
import config from '@/config.json';
import { useState } from "react";
import { useSelection } from "@/contexts/SelectionContext";
import { useSelectionUserStudy } from "@/contexts/SelectionContextUserStudy.jsx";

const WebRTCContext = createContext(null);

/******************************************************************************************************************
 ******************************************************************************************************************
 **
 ******************************************************************************************************************
 ******************************************************************************************************************/
export const WebRTCProvider = ({ children }) => {
    const rtcRef = useRef(null);
    const [dataChannelOpen, setDataChannelOpen] = useState(false);

    if (!rtcRef.current) {
        rtcRef.current = new WebRTC(config.signalServerURL, setDataChannelOpen);
    }

    return (
        <WebRTCContext.Provider value={{rtc: rtcRef.current, dataChannelOpen}}>
            {children}
        </WebRTCContext.Provider>
    );
};

export const useWebRTC = () => useContext(WebRTCContext);

async function waitForBoolean(getterFn, desiredValue = true, timeout = 10000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        function check() {
            if (getterFn() === desiredValue) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error("Timeout while waiting for boolean to change"));
            } else {
                setTimeout(check, 50);
            }
        }
        check();
    });
}

/******************************************************************************************************************
 ******************************************************************************************************************
 **
 ******************************************************************************************************************
 ******************************************************************************************************************/
class WebRTC {
    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    constructor(SIGNAL_SERVER, setDataChannelOpen) {
        this.setDataChannelOpen = setDataChannelOpen;

        this.handlerNames = {
            "/getDatabaseStructureResponse": "onDatabaseStructureRequest",
            "/getUserStudyDatabaseStructureResponse": "onUserStudyDatabaseStructureRequest",
            "/getParticipantsResponse": "onGetParticipantsRequest",
            "/getUserTestSetResponse": "onGetUserTestSetRequest",
            "/getEvaluationResponse": "onMetricsRequest",
            "/getTestSetResultsResponse": "onGetTestSetResultsRequest",
            "/getIntroductionsResponse": "onGetIntroductionsRequest",
            "/getTestSetsResponse": "onGetTestSetsRequest",
            "/getMetricsResponse": "onGetMetricsRequest",
            "/getUserStudyMetaResponse": "onGetUserStudyMetaRequest",
            "/getMethodsResponse": "onAlgorithmsRequest",
            "/getOptionsResponse": "onOptionsRequest",
            "/getResultsResponse": "onGetResultsRequest",

            "/putParticipantResponse": "onPutParticipantRequest",
            "/putSubmissionResponse": "onPutSubmissionRequest",
            "/putTestSetsResponse": "onPutTestSetsRequest",
            "/putMetricResponse": "onPutMetricRequest",

            "/deleteParticipantResponse": "onDeleteParticipantRequest",
            "/deleteMetricResponse": "onDeleteMetricRequest",
            "/deleteTestSetResponse": "onDeleteTestSetRequest",

            "/fileUserStudy": "onFileUserStudyRequest",
        };

        const { setContextConnectedNodes, selectedTurnServer } = useSelection();
        const { setOfferState } = useSelectionUserStudy();

        this.onDbRequest = null;

        this.downloadComplete = true;

        this.socket = io(SIGNAL_SERVER, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });
        this.client_id = this.generateRandomUUID();
        this.database_id = "";
        this.ip_address = "";
        this.client_name = "Client-" + this.generateRandomID();

        const urlParams = new URLSearchParams(window.location.search);
        this.client_type = urlParams.toString() ? "Participant" : "Client";

        // Client-Infos global verfügbar machen + Event auslösen
        try {
            window.webrtcClientInfo = {
                clientId: this.client_id,
                clientName: this.client_name,
                clientType: this.client_type
            };
            window.dispatchEvent(
                new CustomEvent("webrtc:clientInfo", {
                    detail: { 
                        clientId: this.client_id, 
                        clientName: this.client_name,
                        clientType: this.client_type
                    },
                })
            );
        } catch (e) {
            console.warn("Could not publish webrtcClientInfo globally:", e);
        }

        this.sid = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.relayActive = false;
        this.relayRequested = false;
        this.relayFallbackTimer = null;
        this.connectionPassword = null;
        this.connectionTestLink = null;
        this.relayChunks = new Map();

        this.onConnectionStateChange = null;
        this.onRelayStateChange = null;

        this.inputMessage = "";
        this.messages = [];

        this.setServerList = null;
        this.setDatabaseList = null;
        this.setDatabaseSets = null;

        this.setUpdateImage = null;

        this._responseFile = null;
        this._responseSrcFile = null;
        this._responseRefFile = null;
        this._responseOutFile = null;
        this.responseFileTemp = {
            data: null,
            type: null,
            rid: null,
            size: null,
        };

        this.receivedBuffers = [];
        this.receivedBuffersList = [];
        this.receivedPreviewBufferList = {};
        this.downloadedSize = 0;
        this.currentPreviewName = "";

        // last coonnected ComputeNode
        this.lastConnectedSid = window.localStorage.getItem("WebRTCProvider:lastSid") || null;

        // Indicates the type of the received data from the database server
        this.receivedDataType = "";

        console.debug("INFO", `Generate Client Name: ${this.client_name}`);
        console.debug("INFO", `Generate Client ID: ${this.client_id}`);
        console.debug("INFO", "Establish WebRTC connection...");

        // Reactive properties for response files
        Object.defineProperty(this, 'responseFile', {
            get: () => this.__responseFile,
            set: (value) => {
                this.__responseFile = value;
                if (this.onResponseFileChange) {
                    this.onResponseFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseSrcFile', {
            get: () => this.__responseSrcFile,
            set: (value) => {
                this.__responseSrcFile = value;
                if (this.onResponseSrcFileChange) {
                    this.onResponseSrcFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseRefFile', {
            get: () => this.__responseRefFile,
            set: (value) => {
                this.__responseRefFile = value;
                if (this.onResponseRefFileChange) {
                    this.onResponseRefFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseOutFile', {
            get: () => this.__responseOutFile,
            set: (value) => {
                this.__responseOutFile = value;
                if (this.onResponseOutFileChange) {
                    this.onResponseOutFileChange(value);
                }
            }
        });

        // Socket error handling
        this.socket.on("error", (error) => {
            console.debug("ERRO", `Signal Server error at ${SIGNAL_SERVER}.`, error);
        });

        this.socket.on("connect_error", (error) => {
            console.debug("ERRO", `Connection to Signal Server ${SIGNAL_SERVER} failed; retrying.`, error);
        });

        this.socket.on("connect", async () => {
            console.debug("INFO", `Client is connected to Signal Server: ${SIGNAL_SERVER}`);

            let country;
            try {
                const response = await fetch("https://ipapi.co/json/", {
                    signal: AbortSignal.timeout(5000),
                });
                if (response.ok) {
                    const location = await response.json();
                    country = location.country_name;
                }
            } catch (error) {
                console.debug("INFO", "Could not determine client country.", error);
            }

            this.socket.emit("register", {
                client_id: this.client_id,
                name: this.client_name,
                type: this.client_type,
                country,
            });

            // If there is a last connected ComputeNode, automatically reconnect, but only if this client is of type "Client" (Participants should not auto-reconnect, because they automatically connect to a given compute node via URL param)
            if (this.lastConnectedSid && this.client_type == "Client") {                
                console.debug("INFO", `Auto-reconnect to ComputeNode with SID: ${this.lastConnectedSid}`);
                setContextConnectedNodes(this.lastConnectedSid);
                const password = window.localStorage.getItem("WebRTCProvider:password") || null;
                const test_link = window.localStorage.getItem("WebRTCProvider:test_link") || null;
                this.createOffer(this.lastConnectedSid, password, test_link);
            }
        });

        // Signaling messages (offer/answer/candidate)
        this.socket.on("message", async (data) => {
            console.debug("RECV", `[Signalling Server] Received answer to offer.`, data);

            if (data.type === "offer") {
                await this.handleOffer(data.sdp, data.from);
            } else if (data.type === "answer") {
                await this.handleAnswer(data.sdp);
                setOfferState(true);
            } else if (data.type === "candidate") {
                await this.handleCandidate(data.candidate);
            } else if (data.type === "relay_ready") {
                this.relayActive = true;
                this.relayRequested = false;
                this.setDataChannelOpen(true);
                if (this.onRelayStateChange) {
                    this.onRelayStateChange({
                        active: true,
                        serverKey: this.database_id || null,
                    });
                }
                console.debug("INFO", "Connected to Compute Node through WebSocket relay.");
                await this.sendMessage(JSON.stringify({
                    command: "/putIpAddressRequest",
                    data: {
                        ip_address: this.ip_address,
                        client_id: this.client_id,
                        client_name: this.client_name
                    }
                }));
            } else if (data.type === "relay_data") {
                let relayData = data.data;
                if (relayData instanceof Uint8Array) {
                    relayData = new TextDecoder().decode(relayData);
                }
                this.onMessage({ data: relayData });
            } else if (data.type === "relay_chunk") {
                let transfer = this.relayChunks.get(data.transfer_id);
                if (!transfer) {
                    transfer = {
                        total: data.total,
                        chunks: new Array(data.total),
                        received: 0,
                    };
                    this.relayChunks.set(data.transfer_id, transfer);
                }
                if (transfer.chunks[data.index] === undefined) {
                    transfer.chunks[data.index] = data.data;
                    transfer.received += 1;
                }
                if (transfer.received === transfer.total) {
                    this.relayChunks.delete(data.transfer_id);
                    this.onMessage({ data: transfer.chunks.join("") });
                }
            } else if (data.type === "error") {
                console.debug("RECV", `Offer rejected. Reason: ${data.reason}`);
                setOfferState(false);
            }
        });

        this.socket.on("/getComputeNodesResponse", async (data) => {
            console.debug("RECV", `[Signalling Server] Received dictionary of Compute Nodes.`, data);
            await this.handleDbRequest(data);
        });

        this.socket.on("/putSidRequest", async (data) => {
            console.debug("RECV", `[Signalling Server] Received SID: `, data);
            this.sid = data;
        });

        this.socket.on("/putIpAddressRequest", async (data) => {
            console.debug("RECV", `[Signalling Server] Received own ip address: `, data);
            this.ip_address = data;
        });
    }

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    sendArrayBufferInChunks(buffer) {
        const chunkSize = 16 * 1024; // 16 KB
        let offset = 0;

        while (offset < buffer.byteLength) {
            const chunk = buffer.slice(offset, offset + chunkSize);
            this.dataChannel.send(chunk);
            offset += chunkSize;
        }
    }

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    async sendMessage(message = "", chunksEnabled = false) {
        let command = null;
        if (typeof message === "string") {
            try {
                command = JSON.parse(message).command;
            } catch (error) {
                console.warn("Could not inspect outgoing WebRTC message:", error);
            }
        }
        if (command === "/file" || command === "/getUserStudyFileRequest" ||
            command === "/getRatingFileRequest" || command === "/getResultFileRequest") {
            if (!this.downloadComplete)
                await waitForBoolean(() => this.downloadComplete);
            this.downloadComplete = false;
        }

        if (this.relayActive) {
            if (chunksEnabled && message instanceof ArrayBuffer) {
                const chunkSize = 16 * 1024;
                for (let offset = 0; offset < message.byteLength; offset += chunkSize) {
                    this.socket.emit("message", {
                        type: "relay_data",
                        data: message.slice(offset, offset + chunkSize),
                        target: this.database_id,
                        from: this.client_id,
                    });
                }
                return;
            }
            this.socket.emit("message", {
                type: "relay_data",
                data: message,
                target: this.database_id,
                from: this.client_id,
            });
            return;
        }

        const waitForOpen = () => {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    if (this.dataChannel && this.dataChannel.readyState === "open") {
                        resolve();
                    } else if (Date.now() - start > 5000) {
                        reject("DataChannel did not open within 5 seconds.");
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };
        try {
            await waitForOpen();
            if (chunksEnabled && message instanceof ArrayBuffer) {
                this.sendArrayBufferInChunks(message);
            } else {
                this.dataChannel.send(message);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**************************************************************************************************************
     * Send message to signalling server (not to Compute Node). 
     * Used for requesting available Compute Nodes.
     **************************************************************************************************************/
    sendServerMessage(message, data) {
        console.debug("SEND", `[Signalling Server] Request available Compute Nodes via message: ${message}`);

        this.socket.emit("message", {
            type: "answer",
            message: message,
            data: data,
            target: "server",
            from: this.client_id,
        });
    }

    /**************************************************************************************************************
     * Generates a random 4-character ID consisting of uppercase letters and digits.
     **************************************************************************************************************/
    generateRandomID() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**************************************************************************************************************
     * Generates a random UUID.
     **************************************************************************************************************/
    generateRandomUUID() {
        return uuidv4();
    }

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    handleAnswer = async (sdp) => {
        console.debug("INFO","Handling SDP answer from Compute Node over Signalling Server.");

        if (!this.peerConnection || this.peerConnection.connectionState === "closed") {
            console.warn("handleAnswer: no active PeerConnection, ignoring answer");
            return;
        }

        const state = this.peerConnection.signalingState;
        if (state !== "have-local-offer") {
            console.debug("INFO", `handleAnswer: ignoring answer SDP in signalingState='${state}' (expecting 'have-local-offer').`);
            return;
        }

        try {
            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp })
            );
        } catch (err) {
            console.error("Error in handleAnswer / setRemoteDescription:", err);
        }
    };

    /**************************************************************************************************************
     * Handles incoming messages containing the list of available Compute Nodes from the signalling server.
     **************************************************************************************************************/
    handleDbRequest = async (data) => {
        if (this.onDbRequest) {
            this.onDbRequest(data);
        }
    };

    /**************************************************************************************************************
     * Handles incoming ICE candidates
     **************************************************************************************************************/
    handleCandidate = async (candidate) => {
        console.log("Handling candidate:", candidate);

        if (!this.peerConnection || this.peerConnection.connectionState === "closed") {
            console.warn("handleCandidate: no active PeerConnection, ignoring candidate");
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    };

    /**************************************************************************************************************
     * Initializes the RTCPeerConnection and sets up event handlers for ICE candidates and data channels.
     **************************************************************************************************************/
    initPeerConnection(turnServer=null) {

        // If there is still an old connection: close it
        if (this.peerConnection) {
            try {
                this.peerConnection.close();
            } catch (e) {
                console.warn("Error closing previous PeerConnection:", e);
            }
        }

        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                {
                    urls: turnServer?.address || "turn:potechius.com:3478?transport=tcp",
                    username: turnServer?.user || "test",
                    credential: turnServer?.password || "test"
                }
            ]
        });

        // Collect and send ICE candidates via the signaling server
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.debug("SEND", "[Signalling Server] Sending ICE Candidates to Compute Node.", event.candidate);

                this.socket.emit("message", {
                    type: "candidate",
                    candidate: event.candidate,
                    from: this.client_id,
                    target: this.database_id,
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.debug(
                "%c[INFO] PeerConnection state: " + state,
                "color: orange;"
            );
            if (state === "failed") {
                this.activateRelayFallback();
            }

            // React (Server.jsx) informieren
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange({
                    state,
                    serverKey: this.database_id || null,
                });
            }
        };

        this.dataChannel = null;
    }

    activateRelayFallback = () => {
        if (this.relayActive || this.relayRequested || !this.database_id) return;
        this.relayRequested = true;
        this.relayActive = false;
        if (this.relayFallbackTimer) {
            clearTimeout(this.relayFallbackTimer);
            this.relayFallbackTimer = null;
        }
        if (this.peerConnection) this.peerConnection.close();
        const password = this.connectionPassword;
        const testLink = this.connectionTestLink;
        console.debug("INFO", "WebRTC failed; requesting WebSocket relay.");
        this.socket.emit("message", {
            type: "relay_request",
            target: this.database_id,
            from: this.client_id,
            password,
            test_link: testLink,
        });
    };

    /**************************************************************************************************************
     * Combines multiple ArrayBuffers into a single ArrayBuffer
     **************************************************************************************************************/
    combineArrayBuffers = (buffers) => {
        let totalLength = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
        let combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (let buffer of buffers) {
            combinedBuffer.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }
        return combinedBuffer.buffer;
    };

    /**************************************************************************************************************
     * Handles incoming messages from the Compute Node via the DataChannel.
     **************************************************************************************************************/
    async onMessage(event) {
        if (typeof event.data === "string" || (event.data && typeof event.data === "object" && !(event.data instanceof ArrayBuffer))) {
            let message = event.data;
            if (typeof message === "string") {
                message = JSON.parse(message);
            }

            const handlerName = this.handlerNames[message.message];

            if (handlerName && this[handlerName]) {
                this[handlerName](message.data);
                this.receivedPreviewBufferList = {};
            } else if (message.message == "containerTransferStart") {
                console.debug("RECV", '[Compute Node] Start of Container Transfer via message containerTransferStart', message.data);
                this.receivedDataType = message.data;
                this.receivedBuffersList = [];
                this.responseFileTemp.type = message.data["type"];
                this.responseFileTemp.abstractPath = message.data["abstractPath"];
                this.responseFileTemp.rid = message.data["rid"];
                this.responseFileTemp.size = message.data["size"];
                this.responseFileTemp.mode = message.data["mode"];
            } else if (message.message == "fileTransferStart") {
                this.receivedBuffers = [];
            } else if (message.message == "fileTransferEnd") {
                const combinedBuffer = this.combineArrayBuffers(this.receivedBuffers);
                this.receivedBuffersList.push(combinedBuffer);
            } else if (message.message == "containerTransferEnd") {
                console.debug("RECV", "[Compute Node] End of Container Transfer via message containerTransferEnd");

                this.downloadComplete = true;

                this.receivedDataType = "";
                this.responseFileTemp.data = this.receivedBuffersList;
                const RID = this.responseFileTemp.rid;
                const mode = this.responseFileTemp.mode;

                if(mode === "original") {
                    window.dispatchEvent(new CustomEvent("webrtc:file", {
                        detail: {
                            ...this.responseFileTemp
                        }
                    }));
                } else if(mode === "semantics") {
                    window.dispatchEvent(new CustomEvent("webrtc:semanticsFile", {
                        detail: {
                            ...this.responseFileTemp
                        }
                    }));
                } else if(mode === "userstudy") {
                    window.dispatchEvent(new CustomEvent("webrtc:userstudyFile", {
                        detail: {
                            ...this.responseFileTemp
                        }
                    }));
                } else if(mode === "result") {
                    window.dispatchEvent(new CustomEvent("webrtc:resultFile", {
                        detail: {
                            ...this.responseFileTemp
                        }
                    }));
                } else if(mode === "usertest") {
                    window.dispatchEvent(new CustomEvent("webrtc:userTestFile", {
                        detail: {
                            ...this.responseFileTemp
                        }
                    }));
                }

                this.downloadedSize = 0;

                window.dispatchEvent(new CustomEvent("webrtc:downloadProgress", {
                    detail: {
                        rid: this.responseFileTemp.rid,
                        status: "end",
                        progress: 100
                    }
                }));

            } else if (message.message == "fileAvailability") {
                window.dispatchEvent(new CustomEvent("webrtc:fileAvailability", {
                    detail: {
                        ...message.data
                    }
                }));
            } else {
                console.debug("ERRO", "Invalid message received from Compute Node:", message.message);
            }
        } else if (event.data instanceof ArrayBuffer) {
            const bufferSize = event.data.byteLength;
            this.downloadedSize += bufferSize;

            const downloadPercentage = (this.downloadedSize / this.responseFileTemp.size) * 100;

            window.dispatchEvent(new CustomEvent("webrtc:downloadProgress", {
                detail: {
                    rid: this.responseFileTemp.rid,
                    status: "progress",
                    progress: downloadPercentage
                }
            }));

            this.receivedBuffers.push(event.data);

            console.debug("RECV", "[Compute Node] Received ArrayBuffer: ", downloadPercentage.toFixed(2) + "%");
        } else {
            console.log("Received invalid message type:", event.data);
        }
    }

    /**************************************************************************************************************
     * Creates an SDP offer, sets up the DataChannel, and sends the offer to the specified 
     * Compute Node via the signalling server.
     **************************************************************************************************************/
    createOffer = async (sid, password, test_link=null, turnServer=null) => {
        this.database_id = sid;
        this.connectionPassword = password;
        this.connectionTestLink = test_link;
        console.debug("INFO", `Creating offer for Compute Node with SID: ${sid}`);

        // Persist SID to enable auto-reconnect after page reload
        this.lastConnectedSid = sid;
        try {
            window.localStorage.setItem("WebRTCProvider:lastSid", sid);
            window.localStorage.setItem("WebRTCProvider:password", password);
            if (test_link)
                window.localStorage.setItem("WebRTCProvider:test_link", test_link);
        } catch (e) {
            console.warn("Could not persist lastConnectedSid to localStorage:", e);
        }

        // Old PeerConnection / DataChannel cleanly close if they exist, to avoid issues with multiple connections
        if (this.peerConnection) {
            try {
                this.peerConnection.close();
            } catch (e) {
                console.warn("Error closing previous PeerConnection:", e);
            }
            this.peerConnection = null;
            this.dataChannel = null;
            this.relayActive = false;
            this.relayRequested = false;
        }

        // Create peer connection
        this.initPeerConnection(turnServer);

        // Create a new DataChannel
        this.dataChannel = this.peerConnection.createDataChannel("dataChannel", {
            reliable: true,
            ordered: true
        });

        this.dataChannel.bufferedAmountLowThreshold = 64 * 1024; // 64 KB
        this.dataChannel.onopen = () => {
            console.debug("INFO", `DataChannel is open. Connected to Compute Node with ID: ${sid}`);

            this.setDataChannelOpen(true);

            let data_send = {
                command: "/putIpAddressRequest",
                data: {
                    ip_address: this.ip_address,
                    client_id: this.client_id,
                    client_name: this.client_name
                }
            };
            console.debug("SEND", `[Compute Node] Send Client Information via command: /putIpAddressRequest`, data_send);
            this.sendMessage(JSON.stringify(data_send));
        };

        this.dataChannel.onmessage = (event) => {
            this.onMessage(event);
        };

        this.dataChannel.onbufferedamountlow = () => {
            console.log("Puffer hat wieder Platz, sende Resume-Signal an Python");
        };

        this.dataChannel.onclose = () => {
            console.log("DataChannel is closed");
            this.setDataChannelOpen(false);
        };

        this.dataChannel.onerror = (error) => {
            console.error("DataChannel error:", error);
        };

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            console.debug("SEND", "[Signalling Server] Sending Offer", offer);
            this.socket.emit("message", {
                type: "offer",
                sdp: offer.sdp,
                target: sid,
                from: this.client_id,
                password: password,
                test_link: test_link
            });
            this.relayFallbackTimer = setTimeout(
                this.activateRelayFallback,
                10000
            );
        } catch (error) {
            console.error("Error creating or setting local description:", error);
        }
    };

    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    disconnect() {
        if (this.relayActive && this.database_id && this.socket.connected) {
            this.socket.emit("message", {
                type: "relay_close",
                target: this.database_id,
                from: this.client_id,
            });
        }
        if (this.peerConnection) {
            try {
                this.peerConnection.close();
            } catch (e) {
                console.warn("Error closing PeerConnection:", e);
            }
            this.peerConnection = null;
        }
        this.dataChannel = null;
        this.database_id = "";
        this.relayActive = false;
        this.relayRequested = false;
        this.setDataChannelOpen(false);
        if (this.onRelayStateChange) {
            this.onRelayStateChange({active: false, serverKey: null});
        }
        try {
            window.localStorage.removeItem("WebRTCProvider:lastSid");
        } catch (e) {}

        console.debug("INFO", `Disconnected from Compute Node.`)

    }
}

export default WebRTC;