import Navbar from "../../../components/Navbar";
import { useNavigate, useParams } from "react-router";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from "../../../lib/axios.js";
import { useCameraStatus } from "../../../hooks/useCameraStatus";
import { CheckCircle, XCircle, ArrowLeft, Settings } from "lucide-react";
import BoundingPolygonOverlay from "../../../components/BoundingPolygonOverlay";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};


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
    // FIX 1: Initialize as null so we know when data is missing
    const [cameraData, setCameraData] = useState(null);

    // FIX 2: Track local activity for status
    const [lastActivity, setLastActivity] = useState(null);

    const [hasImage, setHasImage] = useState(false);
    const [debugInfo, setDebugInfo] = useState("Waiting...");

    // FIX 3: Initialize Servos as null until DB loads
    const [servoState, setServoState] = useState(null);
    const debouncedServo = useDebounce(servoState, 300);
    const imgRef = useRef(null);
    const previousUrl = useRef(null);


    const fetchDetails = async () => {
        try {
            const response = await api.get(`/api/cameras/get/${serialNumber}`);
            setCameraData(response.data);
            if (response.data?.config) {
                setServoState({
                    pan: response.data.config.servoPan,
                    tilt: response.data.config.servoTilt
                });
            }
        } catch (err) {
            console.error("Error fetching details:", err);
            setError("Failed to load camera details.");
        }
    };

    // --- STATUS LOGIC ---
    // We use lastActivity (updated by WebSocket) instead of just DB data
    const isOnline = useCameraStatus(lastActivity);

    // Add this helper variable inside your component (before the return statement)
    const getCameraStatusLabel = () => {
        const streamEnabled = cameraData?.config?.streamEnabled;

        if (!isOnline && !streamEnabled) return 'OFFLINE & STREAM DISABLED';
        if (!isOnline) return 'OFFLINE';
        if (!streamEnabled) return 'STREAM DISABLED';
        return 'READY';
    };

    const getStatusColor = () => {
        const label = getCameraStatusLabel();
        if (label === 'READY') return 'bg-green-100 text-green-700';
        if (label === 'OFFLINE') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-800'; // For Disabled states
    };

    const handleServoChange = (e) => {
        const { name, value } = e.target;
        setServoState(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    useEffect(() => {
        // Skip the first run (when data is still loading)
        if (!cameraData || !debouncedServo) return;

        // Don't run if values haven't changed from DB (prevents reset loop)
        if (debouncedServo.pan === cameraData.config.servoPan &&
            debouncedServo.tilt === cameraData.config.servoTilt) {
            return;
        }

        const updateServo = async () => {
            try {
                // We send the ENTIRE config, but with updated servo positions
                const payload = {
                    ...cameraData.config, // Keep existing zone/timer settings
                    servoPan: debouncedServo.pan,
                    servoTilt: debouncedServo.tilt
                };

                // Call the API (This pushes to ESP32 via WebSocket)
                await api.put(`/api/cameras/config/${serialNumber}`, payload);
                console.log("Positions synced:", debouncedServo);
            } catch (err) {
                console.error("Failed to move servo", err);
            }
        };

        updateServo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedServo]); // Only runs when debounced value changes

    useEffect(() => {

        fetchDetails();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = "sentryai.onrender.com";
        const wsUrl = `${protocol}//${host}?type=viewer&serial=${serialNumber}`;

        console.log(`[DEBUG] Connecting to: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        ws.binaryType = "blob";

        ws.onopen = () => {
            console.log("[DEBUG] WebSocket Connected");
            setStatus("Live");
        };

        ws.onclose = (event) => {
            console.log("[DEBUG] WebSocket Closed:", event);
            setStatus("Offline");
        };

        ws.onerror = (error) => {
            console.error("[DEBUG] WebSocket Error:", error);
        };

        ws.onmessage = (event) => {
            // We expect a Blob (Binary Image)
            if (event.data instanceof Blob) {
                // FIX 5: Update Activity Timestamp on every frame
                setLastActivity(new Date().toISOString());
                const blob = event.data;
                setDebugInfo("Live");

                // 1. Clean up the previous frame's memory
                if (previousUrl.current) {
                    URL.revokeObjectURL(previousUrl.current);
                }

                // 2. Create a new URL for this frame
                const newUrl = URL.createObjectURL(blob);
                previousUrl.current = newUrl;

                // 3. Update the image source
                if (imgRef.current) imgRef.current.src = newUrl;
                setHasImage(true);
            }
            else {
                console.warn("Received non-blob data:", event.data);
            }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
            // Cleanup last frame on unmount
            if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
        };
    }, [serialNumber]);

    if (!cameraData || !servoState) return <div className="p-10 text-center">Loading Camera...</div>;

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
                    <div className="flex items-center justify-center w-full">
                        {/* 1. Added 'flex flex-col' to stack items vertically */}
                        {/* 2. Removed 'items-center' so the Title stays Left */}
                        <div className="w-full flex flex-col gap-2">

                            {/* Title Section (Naturally aligns left) */}
                            {/* <div className="w-full text-left">
                                <h1 className="text-3xl font-extrabold text-gray-900">Live Feed</h1>
                            </div> */}

                            {/* Stream Section */}
                            {/* 3. Added 'mx-auto' to center ONLY this element */}
                            <div className="mx-auto relative w-full h-auto bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                                <img
                                    ref={imgRef}
                                    alt="Stream"
                                    className={`w-full h-auto ${hasImage ? 'block' : 'hidden'}`} // Toggle hidden/block
                                    onLoad={() => setHasImage(true)}   // Show when image loads successfully
                                    onError={() => setHasImage(false)} // Hide if image breaks/is empty
                                />
                                {/* 2. The Overlay Component (Placed Immediately After Image) */}
                                {/* Only render if cameraData is loaded */}
                                {cameraData && (
                                    <BoundingPolygonOverlay
                                        polyX={cameraData.config?.polyX}
                                        polyY={cameraData.config?.polyY}
                                        zoneEnabled={cameraData.config?.zoneEnabled}
                                    />
                                )}

                                {/* 3. Waiting Placeholder */}
                                {!hasImage && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <p>Waiting for Stream...</p>
                                    </div>
                                )}

                                {/* 4. Debug Info Badge */}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900 bg-opacity-75 text-white text-xs rounded font-mono z-20">
                                    {debugInfo}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN: CAMERA DETAILS ================= */}
                    <div className="flex flex-col h-min">

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden mb-10">

                            {/* Card Header: Type & Status */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    {/* Left Side: Title */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Camera</p>
                                        <h1 className="text-3xl font-extrabold text-gray-900">{cameraData.name}</h1>
                                    </div>

                                    {/* Right Side: Status Badge + Conditional Last Seen */}
                                    <div className="flex flex-col items-end gap-1">
                                        {/* 1. The Status Pill */}
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyle(isOnline ? 'online' : 'offline')}`}>
                                            {getStatusIcon(isOnline ? 'online' : 'offline')}
                                            <span className="font-bold text-xs uppercase tracking-wide">
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>

                                        {/* 2. The Conditional Last Seen Text */}
                                        {!isOnline && (
                                            <span className="text-xs font-medium text-gray-500">
                                                Last seen {formatDateAndTime(lastActivity || cameraData.lastSeen)}
                                            </span>
                                        )}
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

                                {/* Metadata */}
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-md font-bold text-gray-800 mb-2">Apprehension Timer</p>
                                    <span className="font-sm text-gray-700">{cameraData?.config?.apprehensionTimer} seconds</span>
                                </div>

                                <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-200">
                                    <p className="text-md font-bold text-gray-800">Camera Position</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor()}`}>
                                        {getCameraStatusLabel()}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {/* Pan Slider */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-sm font-medium text-gray-700">Pan (Horizontal)</label>
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{servoState.pan}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            name="pan"
                                            min="0" max="180"
                                            value={servoState.pan}
                                            onChange={handleServoChange}
                                            disabled={!isOnline}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                                            <span>Left</span>
                                            <span>Right</span>
                                        </div>
                                    </div>

                                    {/* Tilt Slider */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-sm font-medium text-gray-700">Tilt (Vertical)</label>
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{servoState.tilt}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            name="tilt"
                                            min="0" max="180"
                                            value={servoState.tilt}
                                            onChange={handleServoChange}
                                            disabled={!isOnline}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                                            <span>Down</span>
                                            <span>Up</span>
                                        </div>
                                    </div>
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