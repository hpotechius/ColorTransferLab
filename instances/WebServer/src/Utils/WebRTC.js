/*
Copyright 2025 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/


import io from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
import $ from "jquery";

import {createDBButtons} from 'pages/SideBarRight/Database'
import {createCTButtons} from 'pages/SideBarLeft/Algorithms'
import {createServerButtons} from 'pages/SideBarRight/ComputeNode'
import {consolePrint} from 'Utils/Utils'
import {available_methods} from "Utils/System";

/******************************************************************************************************************
 ******************************************************************************************************************
 ** 
 ******************************************************************************************************************
 ******************************************************************************************************************/
class WebRTC {
    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    constructor(SIGNAL_SERVER) {
        this.socket = io(SIGNAL_SERVER);
        this.client_id = this.generateRandomUUID();
        this.database_id = ""
        this.ip_address = ""
        this.client_name = "Client-" + this.generateRandomID();
        this.sid = null
        this.peerConnection = null;
        this.dataChannel = null;
        this.inputMessage = "";
        this.messages = [];

        this.setServerList = null
        this.setDatabaseList = null
        this.setDatabaseSets = null

        this.setUpdateImage = null

        this._responseFile = null;
        this._responseSrcFile = null;
        this._responseRefFile = null;
        this._responseOutFile = null;
        this.responseFileTemp = {
            data: null,
            type: null,
            rid: null,
            size: null,
        }

        this.receivedBuffers = [];
        this.receivedBuffersList = [];
        this.receivedPreviewBufferList = {};
        this.downloadedSize = 0;
        this.currentPreviewName = "";

        // Indicates the type of the received data from the database server
        this.receivedDataType = ""

        consolePrint("INFO", "Generate Client Name: " + this.client_name)
        consolePrint("INFO", "Generate Client ID: " + this.client_id)

        Object.defineProperty(this, 'responseFile', {
            get: () => this.__responseFile,
            set: (value) => {
                this.__responseFile = value;
                if (this.onResponseFileChange) {
                    // call function when variable changes
                    this.onResponseFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseSrcFile', {
            get: () => this.__responseSrcFile,
            set: (value) => {
                this.__responseSrcFile = value;
                if (this.onResponseSrcFileChange) {
                    // call function when variable changes
                    this.onResponseSrcFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseRefFile', {
            get: () => this.__responseRefFile,
            set: (value) => {
                this.__responseRefFile = value;
                if (this.onResponseRefFileChange) {
                    // call function when variable changes
                    this.onResponseRefFileChange(value);
                }
            }
        });
        Object.defineProperty(this, 'responseOutFile', {
            get: () => this.__responseOutFile,
            set: (value) => {
                this.__responseOutFile = value;
                if (this.onResponseOutFileChange) {
                    // call function when variable changes
                    this.onResponseOutFileChange(value);
                }
            }
        });


        this.socket.on("error", (error) => {
            this.socket.close();
            consolePrint("ERROR", "Connection to Signal Server " + SIGNAL_SERVER + " failed. Please check the connection.")
        });

        this.socket.on("connect_error", (error) => {
            this.socket.close();
            consolePrint("ERROR", "Connection to Signal Server " + SIGNAL_SERVER + " failed. Please check the connection.")
        });

        this.socket.on("connect", () => {
            console.debug("%c[INFO] Client is connected to Signal Server: ", "color: orange;", SIGNAL_SERVER);
            consolePrint("INFO", "Client is connected to Signal Server: " + SIGNAL_SERVER)
            this.socket.emit("register", { 
                client_id: this.client_id,
                name: this.client_name,
                type: "Client",
            });
         });
     
         this.socket.on("message", async (data) => {
            console.debug("%c[RECV] WebRTC Response from Server: Answer to Offer", "color: lightblue;", data);
    
            if (data.type === "offer") {
                await this.handleOffer(data.sdp, data.from);
            } else if (data.type === "answer") {
                await this.handleAnswer(data.sdp);
            } else if (data.type === "candidate") {
                await this.handleCandidate(data.candidate);
            }
        });


        this.socket.on("ce_request", async (data) => {
            console.log("Compute Engine Request received from Signal Server:", data);
            await this.handleCeRequest(data);
        });

        this.socket.on("db_request", async (data) => {
            console.debug("%c[RECV] WebRTC Response from Server: Received Database Dictionary", "color: lightblue;", data)
            await this.handleDbRequest(data);
        });

        this.socket.on("sid", async (data) => {
            this.sid = data
        });

        this.socket.on("/ip_address", async (data) => {
            this.ip_address = data
        });

        this.initPeerConnection();
    }

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
    sendMessage(message="", chunksEnabled=false) {
        if(chunksEnabled) {
            if (this.dataChannel && this.dataChannel.readyState === "open") {
                if (message instanceof ArrayBuffer) {
                    this.sendArrayBufferInChunks(message);
                } else {
                    this.dataChannel.send(message);
                }
            } else {
                console.log("DataChannel is not open.");
            }
        } else {
            if (this.dataChannel && this.dataChannel.readyState === "open") {
                this.dataChannel.send(message);
            } else {
                console.log("DataChannel is not open.");
            }
        }
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    sendServerMessage(message, data) {
        this.socket.emit("message", {
            type: "answer",
            message: message,
            data: data,
            target: "server",
            from: this.client_id,
        });
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    generateRandomID() {
         const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
         let result = '';
         for (let i = 0; i < 4; i++) {
           result += characters.charAt(Math.floor(Math.random() * characters.length));
         }
         return result;
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    generateRandomUUID() {
        return uuidv4();
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    handleOffer = async (sdp, from) => {
        console.log("Handling offer:", sdp);

        await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: "offer", sdp })
        );

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        console.log("Sending answer:", answer);
        this.socket.emit("message", {
            type: "answer",
            sdp: answer.sdp,
            target: from,
            from: this.sid,
        });
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    handleAnswer = async (sdp) => {
        await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: "answer", sdp })
        );
    };


    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    handleCeRequest = async (data) => {
        this.setServerList(data)
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    handleDbRequest = async (data) => {
        createServerButtons(data)
    };

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    handleCandidate = async (candidate) => {
        console.log("Handling candidate:", candidate);
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    /**************************************************************************************************************
     * Initializes the RTCPeerConnection and sets up event handlers for ICE candidates and data channels.
     * 
     * @returns {void}
     **************************************************************************************************************/
    initPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                // {
                //     urls: "turn:potechius.com:3478?transport=tcp",
                //     username: "test",
                //     credential: "test"
                // }
            ]
        });

        // ICE-Kandidaten sammeln und senden
        // this.peerConnection.onicecandidate = (event) => {
        //     if (event.candidate) {
        //         console.log("ICE candidate:", event.candidate);
        //         this.socket.emit("candidate", {
        //             candidate: event.candidate.candidate,
        //             sdpMid: event.candidate.sdpMid,
        //             sdpMLineIndex: event.candidate.sdpMLineIndex,
        //             usernameFragment: event.candidate.usernameFragment,
        //             target: this.database_id,
        //             from: this.client_id,
        //         });
        //     }
        // };
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.debug("%c[SEND] WebRTC Request to Server: Sending ICE Candidate", "color: lightgreen;", event.candidate);
                this.socket.emit("message", {
                    type: "candidate",
                    candidate: event.candidate,
                    from: this.client_id,
                    target: this.database_id,
                });
            }
        };

        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;


            this.dataChannel.onmessage = (event) => {
                console.log("Received message:", event.data);
                this.messages.push(`Received: ${event.data}`);
            };

        };

        this.dataChannel = this.peerConnection.createDataChannel("dataChannel", {
            reliable: true,  // Ensure data is delivered reliably
            ordered: true,  // Ensure messages are delivered in order
            //maxRetransmits: -1  // Unlimited retransmissions for reliability
        });

        this.dataChannel.onopen = () => {
            console.debug("%c[INFO] DataChannel is open", "color: orange;");
            consolePrint("INFO", "Connected to Compute Node with ID: " + this.database_id)
        };
        this.dataChannel.onclose = () => {
            console.debug("%c[INFO] DataChannel is closed", "color: orange;");
        };
    }

    /**************************************************************************************************************
     * Combines multiple ArrayBuffers into a single ArrayBuffer
     *  
     * @param {ArrayBuffer[]} buffers - An array of ArrayBuffer objects to be combined.
     * @returns {ArrayBuffer} - A new ArrayBuffer containing the concatenated data from all input ArrayBuffers.
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
     * 
     **************************************************************************************************************/
    async onMessage(event) {
        //console.log("Received message");
        if (typeof event.data === "string") {
            let messageString = event.data.replace(/'/g, '"');
            messageString = messageString.replaceAll("True", "true");
            messageString = messageString.replaceAll("False", "false");
            messageString = messageString.replaceAll("None", "null");
            
            const message = JSON.parse(messageString)
            if(message.message == "dbStructure") {
                console.debug("%c[RECV] WebRTC Response from Database: Received DB Structure", "color: lightblue;", message.data)
                createDBButtons(message.data, this.receivedPreviewBufferList)
                this.receivedPreviewBufferList = {}
                // console.debug("%c[SEND] WebRTC Request to Database: Get Previews", "color: lightblue;");

                // const data_send = {
                //     command: "previews",
                //     data: ""
                // }
                // this.sendMessage(JSON.stringify(data_send))
            } else if(message.message == "evaluation") {
                console.debug("%c[RECV] WebRTC Response from Database: Received Evaluation Result for Metric:", "color: lightblue;", message.data["metric"], message.data["value"])
                document.getElementById("metric_"+message.data["metric"]).textContent = message.data["value"];
            } else if(message.message == "methods") {
                console.debug("%c[RECV] WebRTC Response from Database: Received List of Methods", "color: lightblue;")

                const available_methods_remote = message.data["methods"]
                Object.assign(available_methods, available_methods_remote)
                const method_options = message.data["options"]
                createCTButtons(available_methods_remote, method_options)
            } else if(message.message == "containerTransferStart") {
                console.debug('%c[RECV] WebRTC Response from Database: Start of Container Transfer of type:', 'color: lightblue', message.data)
                // Store the data type of the received files in order to process the incoming data correctly
                this.receivedDataType = message.data
                // Buffer has to be resetted
                this.receivedBuffersList = [];
                this.responseFileTemp.type = message.data["type"]
                this.responseFileTemp.abstractPath = message.data["abstractPath"]
                this.responseFileTemp.rid = message.data["rid"]
                this.responseFileTemp.size = message.data["size"]

                const view_loadingID = "view_loading_" + "renderer_" + this.responseFileTemp.rid
                $(`#${view_loadingID}`).css("display", "block")

                const renderbarid = "renderer_bar" + "renderer_" + this.responseFileTemp.rid
                const renderbardownloadid = renderbarid + "_download"
                const renderbartextid = renderbarid + "_text"
                $(`#${renderbarid}`).css("display", "flex")
                $(`#${renderbardownloadid}`).css("width", "0%");
                $(`#${renderbartextid}`).html("");

            } else if(message.message == "fileTransferStart") {
                // console.debug("%c[RECV] WebRTC Response from Database: Start of File Transfer of type:", "color: lightblue;", message.data)
                this.receivedBuffers = [];
            } else if(message.message == "fileTransferEnd") {
                // console.debug("%c[RECV] WebRTC Response from Database: End of File Transfer", "color: lightblue;")
                const combinedBuffer = this.combineArrayBuffers(this.receivedBuffers);
                this.receivedBuffersList.push(combinedBuffer);

            } else if(message.message == "containerTransferEnd") {
                console.debug("%c[RECV] WebRTC Response from Database: End of Container Transfer", "color: lightblue;")
                // remove the data type in order to allow new file transfers
                this.receivedDataType = ""
                this.responseFileTemp.data = this.receivedBuffersList
                const RID = this.responseFileTemp.rid
                if(RID == "src")
                    this.responseSrcFile = this.responseFileTemp
                else if(RID == "ref")
                    this.responseRefFile = this.responseFileTemp
                else if(RID == "out")
                    this.responseOutFile = this.responseFileTemp

                this.downloadedSize = 0;
                // this.responseFile = this.responseFileTemp
                // this.responseFile = this.receivedBuffersList

                const renderbarid = "renderer_bar" + "renderer_" + this.responseFileTemp.rid
                const renderbardownloadid = renderbarid + "_download"
                const renderbartextid = renderbarid + "_text"

                $(`#${renderbarid}`).css("display", "none")
                $(`#${renderbardownloadid}`).css("width", "0%");
                $(`#${renderbartextid}`).html("DONE");

                const view_loadingID = "view_loading_" + "renderer_" + this.responseFileTemp.rid
                $(`#${view_loadingID}`).css("display", "none")
                
            } else if(message.message == "previewsTransferStart") {
                console.debug('%c[RECV] WebRTC Response from Database: Start of Previews Transfer of type:', 'color: lightblue', message.data)
                // Store the data type of the received files in order to process the incoming data correctly
                // this.receivedDataType = message.data
                // Buffer has to be resetted
                this.receivedBuffersList = [];
            } else if(message.message == "previewfileTransferStart") {
                this.currentPreviewName = message.data
                this.receivedBuffers = [];
            } else if(message.message == "previewfileTransferEnd") {
                const combinedBuffer = this.combineArrayBuffers(this.receivedBuffers);
                this.receivedPreviewBufferList[this.currentPreviewName] = combinedBuffer
                // this.receivedBuffersList.push(combinedBuffer);
            } else if(message.message == "previewsTransferEnd") {
                console.debug("%c[RECV] WebRTC Response from Database: End of Previews Transfer", "color: lightblue;")
                // remove the data type in order to allow new file transfers
                this.receivedDataType = ""
                //console.log(this.receivedPreviewBufferList)

                console.debug("%c[SEND] WebRTC Request to Database: Get Database Structure via /dbStructure", "color: lightgreen;");
                let data_send = {
                    command: "dbStructure",
                    data: "none"
                }
                this.sendMessage(JSON.stringify(data_send))

                console.debug("%c[SEND] WebRTC Request to Database: Get List of Methods via /methods", "color: lightgreen;");
                data_send = {
                    command: "/methods",
                    data: ""
                }
                this.sendMessage(JSON.stringify(data_send))
                // this.responseFile = this.receivedBuffersList
            } else if(message.message == "error") {
                consolePrint("ERROR", message.data["response"])
                // shows a loading screen while executing the selected algorithm
                const view_loadingID = "view_loading_renderer_out"
                $(`#${view_loadingID}`).css("display", "none")
            } else if(message.message == "warning") {
                consolePrint("WARNING", message.data["response"])
                // shows a loading screen while executing the selected algorithm
                const view_loadingID = "view_loading_renderer_out"
                $(`#${view_loadingID}`).css("display", "none")

            // } else if(message.message == "outputfileTransferStart") {
            //     this.currentPreviewName = message.data
            //     this.receivedBuffers = [];
            // } else if(message.message == "outputfileTransferEnd") {
            //     const combinedBuffer = this.combineArrayBuffers(this.receivedBuffers);
            //     this.receivedPreviewBufferList[this.currentPreviewName] = combinedBuffer
            } else {
                console.log(message.data)
            }
        } else if (event.data instanceof ArrayBuffer) {
            const bufferSize = event.data.byteLength;
            this.downloadedSize += bufferSize;
  
            const downloadPercentage = (this.downloadedSize / this.responseFileTemp.size) * 100;
            const renderbarid = "renderer_bar" + "renderer_" + this.responseFileTemp.rid
            const renderbardownloadid = renderbarid + "_download"
            const renderbartextid = renderbarid + "_text"
            $(`#${renderbardownloadid}`).css("width", downloadPercentage + "%");
            $(`#${renderbartextid}`).html("Download: " +`${this.downloadedSize}` + " / " + `${this.responseFileTemp.size}` + " Bytes");

            this.receivedBuffers.push(event.data);

            console.debug("%c[RECV] WebRTC Response from ComputeNode: Received ArrayBuffer", "color: lightblue;", downloadPercentage)
        } else {
            console.log("Received invalid message type:", event.data);
        }
    }

    /**************************************************************************************************************
     * 
     **************************************************************************************************************/
    createOffer = async (sid) => {
        this.database_id = sid

        //this.dataChannel = this.peerConnection.createDataChannel("chat");
        this.dataChannel = this.peerConnection.createDataChannel("dataChannel", {
            reliable: true,  // Ensure data is delivered reliably
            ordered: true,  // Ensure messages are delivered in order
            //maxRetransmits: -1,  // Unlimited retransmissions for reliability
            //maxPacketLifeTime: null // Keine Zeitbegrenzung für die Übertragung
        });

        // Puffer überwachen
        this.dataChannel.bufferedAmountLowThreshold = 64 * 1024; // 64 KB

        console.log(this.peerConnection);
        this.dataChannel.onopen = () => {
            console.debug("%c[SEND] WebRTC Request to Compute Node: Set Client Information in Compute Node", "color: lightgreen;");
            let data_send = {
                command: "/ip_address",
                data: {
                    ip_address: this.ip_address,
                    client_id: this.client_id,
                    client_name: this.client_name
                }
            }
            this.sendMessage(JSON.stringify(data_send))

            console.debug("%c[SEND] WebRTC Request to Database: Get previews via /previews", "color: lightgreen;");
            data_send = {
                command: "previews",
                data: ""
            }
            this.sendMessage(JSON.stringify(data_send))
        };
        this.dataChannel.onmessage = (event) => {
            console.log("Received message:", event.data);
            this.onMessage(event)
        };

        this.dataChannel.onbufferedamountlow = () => {
            console.log("Puffer hat wieder Platz, sende Resume-Signal an Python");
            //readyToReceive = true;
            //sendResumeSignalToPython();
        };

        this.dataChannel.onclose = () => {
            console.log("DataChannel is closed FUUUUU");
        }

        this.dataChannel.onerror = (error) => {
            console.error("DataChannel error:", error);
        };
    
        // const offer = await this.peerConnection.createOffer();
        // await this.peerConnection.setLocalDescription(offer);
    
        // console.debug("%c[SEND] WebRTC Request to Server: Sending Offer", "color: lightgreen;", offer);
        // this.socket.emit("message", {
        //     type: "offer",
        //     sdp: offer.sdp,
        //     target: sid,
        //     from: this.client_id,
        // });

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            console.debug("%c[SEND] WebRTC Request to Server: Sending Offer", "color: lightgreen;", offer);
            this.socket.emit("message", {
                type: "offer",
                sdp: offer.sdp,
                target: sid,
                from: this.client_id,
            });
            // this.socket.emit("message", {
            //     type: "offer",
            //     sdp: offer.sdp,
            //     target: sid,
            //     from: this.client_id,
            // }, (ack) => {
            //     if (ack.status === 'ok') {
            //         console.debug("Offer successfully sent and acknowledged by server.");
            //     } else {
            //         console.error("Failed to send offer:", ack.error);
            //     }
            // });
        } catch (error) {
            console.error("Error creating or setting local description:", error);
        }    
    };
}

export default WebRTC;