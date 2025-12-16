import React from 'react'
import Navbar from '../components/Navbar'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../lib/axios";

// ================= CONFIGURATION =================
// 1. Enter your backend URL manually to rule out any import errors
//    (Do not add a trailing slash)
const BACKEND_URL = "https://sentryai.onrender.com"; // OR "http://localhost:5000"

// 2. Your Serial Number
const SERIAL_NUMBER = "SN-001";
// =================================================

const CamerasPage = () => {
    const [feedHash, setFeedHash] = useState(Date.now());
    const [error, setError] = useState(false);

    useEffect(() => {
        // Refresh the image 2 times per second (500ms)
        const interval = setInterval(() => {
            setFeedHash(Date.now());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // Construct the URL
    const streamUrl = `${BACKEND_URL}/stream/${SERIAL_NUMBER}/feed?t=${feedHash}`;

    // Debug: Print to F12 Console so you can click and verify
    console.log("Fetching Frame:", streamUrl);


    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-white font-mono mb-4">
                    Live Feed: <span className="text-green-400">{SERIAL_NUMBER}</span>
                </h1>

                <div className="relative border-2 border-gray-800 bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                    style={{ width: '640px', height: '480px' }}>

                    {/* KEY FIX: key={feedHash} 
                   This forces React to destroy and recreate the <img> tag every time.
                   It prevents the browser from "getting stuck" on an old image.
                */}
                    <img
                        key={feedHash}
                        src={streamUrl}
                        className="w-full h-full object-contain block"
                        alt="Live Stream"
                        onError={() => setError(true)}
                        onLoad={() => setError(false)}
                        style={{ display: error ? 'none' : 'block' }}
                    />

                    {/* ERROR STATE UI */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                            <div className="text-4xl mb-2">📡</div>
                            <p className="font-bold">Connecting...</p>
                            <p className="text-xs mt-2 opacity-50">{streamUrl}</p>
                        </div>
                    )}

                    {/* LIVE INDICATOR */}
                    {!error && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">
                            LIVE
                        </div>
                    )}
                </div>

                <p className="text-gray-600 text-xs mt-4 font-mono">
                    Refreshing every 500ms
                </p>
            </div>
        </div>

    )
}

export default CamerasPage
