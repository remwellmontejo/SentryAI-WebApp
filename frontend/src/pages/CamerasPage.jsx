import React from 'react'
import Navbar from '../components/Navbar'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../lib/axios";

const CamerasPage = () => {
    const { id } = useParams();
    const [imageSrc, setImageSrc] = useState(null); // Stores the Base64 string
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const fetchFrame = async () => {
            try {
                // Fetch the JSON containing the Base64 string
                const res = await api.get(`/api/stream/${id}/feed`);

                if (res.data.image) {
                    setImageSrc(res.data.image);
                    setIsOnline(true);
                }
            } catch (err) {
                // If 404 (No Signal), just keep the old image or show offline
                setIsOnline(false);
            }
        };

        // Poll every 500ms
        const interval = setInterval(fetchFrame, 500);
        fetchFrame(); // Initial fetch

        return () => clearInterval(interval);
    }, [id]);

    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">

                    {/* 1. IF WE HAVE A SIGNAL, SHOW IT */}
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${isOnline ? 'opacity-100' : 'opacity-50 grayscale'}`}
                            alt="Live Stream"
                        />
                    ) : (
                        /* 2. IF NO SIGNAL EVER RECEIVED */
                        <div className="text-gray-500 text-center">
                            <p className="text-2xl font-bold">Waiting for Signal...</p>
                        </div>
                    )}

                    {/* STATUS BADGE */}
                    <div className={`absolute top-4 left-4 px-2 py-1 rounded text-xs font-bold ${isOnline ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                        {isOnline ? "● LIVE" : "● OFFLINE"}
                    </div>
                </div>
            </div>
        </div>

    )
}

export default CamerasPage
