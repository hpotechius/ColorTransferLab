
/*
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
*/

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GitHubIcon from '@mui/icons-material/GitHub';
import "./LandingPage.scss";

export default function LandingPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [institution, setInstitution] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const modelViewerRef = useRef(null);

    useEffect(() => {
        if (!document.querySelector('script[data-model-viewer="true"]')) {
            const script = document.createElement("script");
            script.type = "module";
            script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
            script.setAttribute("data-model-viewer", "true");
            document.head.appendChild(script);
        }
    }, []);

    useEffect(() => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        let intervalId;

        const hslToRgb = (h, s, l) => {
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            let r = 0;
            let g = 0;
            let b = 0;

            if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
            else if (h < 120) [r, g, b] = [x, c, 0];
            else if (h < 180) [r, g, b] = [0, c, x];
            else if (h < 240) [r, g, b] = [0, x, c];
            else if (h < 300) [r, g, b] = [x, 0, c];
            else [r, g, b] = [c, 0, x];

            return [r + m, g + m, b + m];
        };

        const startColorCycle = () => {
            const firstMaterial = modelViewer.model?.materials?.[0];
            if (!firstMaterial?.pbrMetallicRoughness) return;

            let hue = 0;
            intervalId = window.setInterval(() => {
                hue = (hue + 1) % 360;
                const [r, g, b] = hslToRgb(hue, 0.75, 0.55);
                firstMaterial.pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1]);
            }, 60);
        };

        modelViewer.addEventListener("load", startColorCycle, { once: true });

        return () => {
            if (intervalId) window.clearInterval(intervalId);
            modelViewer.removeEventListener("load", startColorCycle);
        };
    }, []);

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        if (isSignUp) {
            if (email && name && institution && password) {
                navigate("/ColorTransferLab/app");
            } else {
                setError("Bitte Email, Name, Institution und Passwort eingeben.");
            }
        } else {
            if (username && password) {
                navigate("/ColorTransferLab/app");
            } else {
                setError("Bitte Benutzername und Passwort eingeben.");
            }
        }
    };

    return (
        <div className="landingpage">
            <div className="landingpage-background"/>
            <div className="landingpage-glow1" />
            <div className="landingpage-glow2"/>

            <div className="landingpage-container">
                <nav className="landingpage-nav">
                    <div className="landingpage-brand">
                        <div className="landingpage-branddot"/>
                        <span>ColorTransferLab</span>
                    </div>

                    <div className="landingpage-navlinks">
                        <a
                            href="https://github.com/hpotechius/ColorTransferLab"
                            target="_blank"
                            rel="noreferrer"
                            className="landingpage-navlink"
                        >
                            <GitHubIcon fontSize="large" />
                        </a>
                    </div>
                </nav>

                <div className="landingpage-wrapper">
                    <section className="landingpage-maincard" >
                        <div className="landingpage-herorow">
                            <div className="landingpage-herotext">
                                <h1 className="landingpage-title">
                                    Simplify Your
                                    <br />
                                    <span className="landingpage-titleaccent">Color Transfer</span> Research
                                </h1>

                                <p className="landingpage-text">
                                    Explore a modern platform for color transfer, algorithm evaluation,
                                    and perceptual comparison. With support for different data modalities, e.g. images, videos, and 3D models.
                                </p>
                            </div>

                            <div className="landingpage-modelcard">
                                <model-viewer
                                    ref={modelViewerRef}
                                    className="landingpage-modelviewer"
                                    src={`${import.meta.env.BASE_URL}models/Achat.glb`}
                                    alt="3D model preview"
                                    camera-controls
                                    auto-rotate
                                    shadow-intensity="1"
                                    exposure="1"
                                />
                            </div>
                        </div>

                        <div className="landingpage-ctaRow">
                            <button
                                className="landingpage-primarybutton"
                                onClick={() => navigate("/ColorTransferLab/")}
                            >
                                Open ColorTransferLab
                            </button>
                            {/* <button className="landingpage-primarybutton"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setError("");
                                }}
                            >
                                Login
                            </button>
                            <button
                                className="landingpage-secondarybutton"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setError("");
                                }}
                            >
                                Sign Up
                            </button> */}
                        </div>

                        {/* <form className="landingpage-authform" onSubmit={handleAuthSubmit}>
                            {isSignUp ? (
                                <>
                                    <input
                                        className="landingpage-authinput"
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <input
                                        className="landingpage-authinput"
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <input
                                        className="landingpage-authinput"
                                        type="text"
                                        placeholder="Institution"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                    />
                                    <input
                                        className="landingpage-authinput"
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </>
                            ) : (
                                <>
                                    <input
                                        className="landingpage-authinput"
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <input
                                        className="landingpage-authinput"
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </>
                            )}

                            {error && <div className="landingpage-autherror">{error}</div>}

                            <button type="submit" className="landingpage-confirmbutton">
                                {isSignUp ? "Confirm Sign Up" : "Confirm Login"}
                            </button>
                        </form> */}

                        <div className="landingpage-wave">
                            <div className="landingpage-wave1"/>
                            <div className="landingpage-wave2"/>
                            <div className="landingpage-wave3"/>
                        </div>
                    </section>
                </div>

                <section className="landingpage-infogrid">
                    <div className="landingpage-infocard">
                        <div className="landingpage-infotitle">Supported Algorithms</div>
                        <div className="landingpage-infotext">
                            In total 19 algorithms for color transfer, style transfer, and colorization are supported, with more to come.
                        </div>
                        <div className="landingpage-infochips">
                            <div className="landingpage-infochip">Color Transfer</div>
                            <div className="landingpage-infochip">Style Transfer</div>
                            <div className="landingpage-infochip">Colorization</div>
                        </div>
                    </div>

                    <div className="landingpage-infocard">
                        <div className="landingpage-infotitle">Data Modalities</div>
                        <div className="landingpage-infotext">
                            Besides images, also videos and 3D models can be processed.
                        </div>
                        <div className="landingpage-infochips2">
                            <div className="landingpage-infochip">2D Data</div>
                            <div className="landingpage-infochip">3D Data</div>
                        </div>
                    </div>

                    <div className="landingpage-infocard">
                        <div className="landingpage-infotitle">Standardized Evaluation</div>
                        <div className="landingpage-infotext">
                            A variety of metrics for objective color transfer results is implemented. Additionally, subjective evaluation can be performed using the integrated user study module.
                        </div>
                        <div className="landingpage-infochips2">
                            <div className="landingpage-infochip">Objective Evaluation</div>
                            <div className="landingpage-infochip">Subjective Evaluation</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}