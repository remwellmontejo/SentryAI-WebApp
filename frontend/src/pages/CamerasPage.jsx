import React from 'react'
import Navbar from '../components/Navbar'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../lib/axios";

// ⚠️ HARDCODED SERIAL NUMBER
// This must match the code inside your ESP32
const HARDCODED_SERIAL = "SN-001";

const CamerasPage = () => {

    const [feedHash, setFeedHash] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setFeedHash(Date.now());
        }, 500); // 2 FPS Refresh
        return () => clearInterval(interval);
    }, []);

    // Point directly to /api/stream/SN-001/feed
    const streamUrl = `${api.defaults.baseURL}/api/stream/feed?t=${feedHash}`;


    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-white mb-4 font-mono">Camera: {HARDCODED_SERIAL}</h1>

                <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    <img
                        src={streamUrl}
                        className="w-full h-full object-contain block"
                        alt="Live Stream"
                    />
                </div>
            </div>
        </div>

    )
}

export default CamerasPage
