import Navbar from "../../../components/Navbar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import React, { useState, useEffect, useRef } from 'react';
import api from "../../../lib/axios.js";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Edit, Settings, Trash2 } from "lucide-react";
import { useParams } from "react-router";

// ================= CONFIGURATION =================
const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'online': return "bg-green-100 text-green-800 border-green-200";
        case 'offline': return "bg-red-100 text-red-800 border-red-200";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'online': return <CheckCircle size={16} />;
        case 'offline': return <XCircle size={16} />;
    }
};

const formatDateAndTime = (isoString) => {
    if (!isoString) return "N/A";

    return new Date(isoString).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'long',    // e.g., "December"
        day: 'numeric',   // e.g., "16"
        year: 'numeric',  // e.g., "2025"
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};


const CameraDetailsPage = () => {
    const { serialNumber } = useParams();
    const navigate = useNavigate();
    const [cameraData, setCameraData] = useState([]);

    const [isConnected, setIsConnected] = useState(false);
    const imgRef = useRef(null); // Reference to the <img> tag
    const wsRef = useRef(null);  // Reference to WebSocket

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/api/cameras/get/${serialNumber}`);
                setCameraData(response.data);
            } catch (err) {
                console.error("Error fetching details:", err);
                setError("Failed to load camera details.");
            }
        };
        fetchDetails();

        // 1. Connect to WebSocket
        // Note: If your site is https, use wss. If http, use ws.
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//sentryai.onrender.com?type=viewer&serial=${serialNumber}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to Stream");
            setIsConnected(true);
        };

        // 2. Handle Incoming Images
        ws.onmessage = (event) => {
            // The message is a Blob (Binary Image)
            const blob = event.data;

            // Create a temporary URL for the Blob
            const imageUrl = URL.createObjectURL(blob);

            // Update the image source directly (Fast!)
            if (imgRef.current) {
                // Revoke the old URL to free memory
                if (imgRef.current.src) URL.revokeObjectURL(imgRef.current.src);
                imgRef.current.src = imageUrl;
            }
        };

        ws.onclose = () => setIsConnected(false);

        // Cleanup on Unmount
        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [serialNumber]);

    return (
        <div className="min-h-screen bg-gray-50" data-theme="corporateBlue">
            <Navbar />
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                        <ArrowLeft size={20} /> Back
                    </button>
                </div>
                <div className="grid lg:grid-cols-2 gap-8 lg:items-center">

                    {/* ================= LEFT COLUMN: LIVE STREAM ================= */}
                    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
                        {/* The Image Element */}
                        <img
                            ref={imgRef}
                            alt="Live Stream"
                            className="w-full h-full object-contain"
                        />

                        {/* Overlays */}
                        {!isConnected && (
                            <div className="absolute text-white font-bold">Connecting...</div>
                        )}
                        {isConnected && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded animate-pulse">
                                LIVE
                            </div>
                        )}
                    </div>

                    {/* ================= RIGHT COLUMN: CAMERA DETAILS ================= */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">

                            {/* Card Header: Type & Status */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Camera</p>
                                        <h1 className="text-3xl font-extrabold text-gray-900">{cameraData.name}</h1>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyle(cameraData.status)}`}>
                                        {getStatusIcon(cameraData.status)}
                                        <span className="font-bold text-xs uppercase tracking-wide">{cameraData.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body: Info Grid */}
                            <div className="p-6 space-y-6 flex-1">

                                {/* Plate Number */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Serial Number</p>
                                    <div className="inline-block bg-gray-100 border-2 border-gray-300 rounded px-4 py-2">
                                        <span className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                                            {cameraData.serialNumber}
                                        </span>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-cen  ter gap-2 text-blue-600 mb-1">
                                            <Calendar size={16} />
                                            <span className="text-xs font-bold uppercase">Last Online</span>
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">{formatDateAndTime(cameraData.lastSeen)}</p>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="grid grid-rows-2 gap-y-2 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Configurations</p>
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase block mb-1">Confidence Level</span>
                                        <span className="font-medium text-gray-700"></span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase block mb-1">Centroid Location</span>
                                        <div className="flex items-center gap-1 text-gray-600 font-mono text-sm">

                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Action Buttons */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg border border-gray-300 shadow-sm transition-all hover:shadow-md text-sm">
                                        <Edit size={16} /> Edit Details
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all hover:shadow-md text-sm">
                                        <Trash2 size={16} /> Delete Record
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CameraDetailsPage