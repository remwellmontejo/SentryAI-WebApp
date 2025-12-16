import React from 'react'
import Navbar from '../components/Navbar'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../lib/axios";

const CamerasPage = () => {
    const { id } = useParams();

    // 2. State to force refresh
    const [timestamp, setTimestamp] = useState(Date.now());
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Refresh the image URL every 500ms (2 FPS)
        const interval = setInterval(() => {
            setTimestamp(Date.now());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // 3. Handle Image Load Success/Failure
    const handleImageLoad = () => setIsOnline(true);
    const handleImageError = () => setIsOnline(false);

    // 4. Construct URL
    // We append ?t=timestamp so the browser doesn't cache the old image
    const streamUrl = `${api.defaults.baseURL}/api/stream/${id}/feed?t=${timestamp}`;

    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">

                {/* CONTAINER */}
                <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center">

                    {/* THE IMAGE */}
                    <img
                        src={streamUrl}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        className={`w-full h-full object-contain ${isOnline ? 'block' : 'hidden'}`}
                        alt="Live Stream"
                    />

                    {/* OFFLINE FALLBACK UI */}
                    {!isOnline && (
                        <div className="text-center text-gray-500">
                            <div className="animate-pulse mb-2 text-4xl">📡</div>
                            <p className="text-xl font-bold">Waiting for Signal...</p>
                            <p className="text-sm opacity-50">Turn on your ESP32</p>
                        </div>
                    )}

                    {/* ONLINE BADGE */}
                    {isOnline && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded animate-pulse shadow-lg">
                            ● LIVE
                        </div>
                    )}
                </div>

                {/* DEBUG INFO */}
                <div className="mt-4 text-gray-600 text-xs font-mono">
                    Endpoint: /api/stream/{id}/feed
                </div>
            </div>
        </div>

    )
}

export default CamerasPage
