import Navbar from "../../../components/Navbar";
import { useNavigate, useParams } from "react-router";
import React, { useState, useEffect, useRef } from 'react';
import api from "../../../lib/axios.js";
import { useCameraStatus } from "../../../hooks/useCameraStatus";
import {
    CheckCircle, XCircle, ArrowLeft, Settings,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw
} from "lucide-react";
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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};


const CameraDetailsPage = () => {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    const [cameraData, setCameraData] = useState(null);
    const [lastActivity, setLastActivity] = useState(null);
    const [hasImage, setHasImage] = useState(false);

    // Servo Movement State
    const [isServoMoving, setIsServoMoving] = useState(false);

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
        }
    };

    const isOnline = useCameraStatus(lastActivity);

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
        return 'bg-yellow-100 text-yellow-800';
    };

    // --- D-PAD HANDLER ---
    const handleServoNudge = (axis, direction) => {
        if (isServoMoving) return;

        // Optimistically lock the UI to prevent double clicks before WS response
        setIsServoMoving(true);

        setServoState(prev => {
            if (!prev) return prev;
            const step = 5; // 5 degrees per click
            let newVal = prev[axis] + (direction * step);

            // Constrain between 0 and 180
            if (newVal < 0) newVal = 0;
            if (newVal > 180) newVal = 180;

            return { ...prev, [axis]: newVal };
        });
    };

    useEffect(() => {
        if (!cameraData || !debouncedServo) return;

        if (debouncedServo.pan === cameraData.config.servoPan &&
            debouncedServo.tilt === cameraData.config.servoTilt) {
            return;
        }

        const updateServo = async () => {
            try {
                const payload = {
                    ...cameraData.config,
                    servoPan: debouncedServo.pan,
                    servoTilt: debouncedServo.tilt
                };

                await api.put(`/api/cameras/config/${serialNumber}`, payload);
                console.log("Positions synced to backend:", debouncedServo);
            } catch (err) {
                console.error("Failed to move servo", err);
                setIsServoMoving(false);
            }
        };

        updateServo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedServo]);

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
        };

        ws.onclose = (event) => {
            console.log("[DEBUG] WebSocket Closed:", event);
        };

        ws.onerror = (error) => {
            console.error("[DEBUG] WebSocket Error:", error);
        };

        ws.onmessage = (event) => {
            // 1. Handle Video Frames
            if (event.data instanceof Blob) {
                setLastActivity(new Date().toISOString());
                const blob = event.data;

                if (previousUrl.current) {
                    URL.revokeObjectURL(previousUrl.current);
                }

                const newUrl = URL.createObjectURL(blob);
                previousUrl.current = newUrl;

                if (imgRef.current) imgRef.current.src = newUrl;
                setHasImage(true);
            }
            // 2. Handle Text Messages (Lock/Unlock)
            else if (typeof event.data === "string") {
                try {
                    const data = JSON.parse(event.data);

                    // Explicitly lock/unlock based on hardware status
                    if (data.type === "servo_moving") {
                        setIsServoMoving(data.status); // true = loading/disabled, false = ready/enabled
                        if (data.status === false) {
                            console.log("Hardware confirmed servo movement complete.");
                        }
                    }
                } catch (e) {
                    // Ignore non-JSON text
                }
            }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
            if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
        };
    }, [serialNumber]);

    if (!cameraData || !servoState) return <div className="p-10 text-center">Loading Camera...</div>;

    // Disabled logic
    const isControlDisabled = !isOnline || isServoMoving;

    return (
        <div className="min-h-screen bg-gray-50" data-theme="corporateBlue">
            <Navbar />
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                        <ArrowLeft size={20} /> Back
                    </button>
                </div>
                <div className="grid lg:grid-cols-2 gap-8 lg:items-center">

                    {/* ================= LEFT COLUMN: LIVE STREAM ================= */}
                    <div className="flex items-center justify-center w-full">
                        <div className="w-full flex flex-col gap-2">
                            <div className="mx-auto relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                                <img
                                    ref={imgRef}
                                    alt="Stream"
                                    className={`w-full aspect-square object-cover object-center ${hasImage ? 'block' : 'hidden'}`}
                                    onLoad={() => setHasImage(true)}
                                    onError={() => setHasImage(false)}
                                />

                                {cameraData && (
                                    <BoundingPolygonOverlay
                                        polyX={cameraData.config?.polyX}
                                        polyY={cameraData.config?.polyY}
                                        zoneEnabled={cameraData.config?.zoneEnabled}
                                    />
                                )}

                                {!hasImage && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <p>Waiting for Stream...</p>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 px-2 py-1 bg-opacity-0 text-white text-xs rounded font-mono z-20">
                                    <button
                                        onClick={() => navigate(`/cameras/settings/${cameraData.serialNumber}`)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-blue-600 text-white rounded-lg transition-all backdrop-blur-sm border border-white/10"
                                    >
                                        <Settings size={18} />
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            Settings
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN: CAMERA DETAILS ================= */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden mb-10">

                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Camera</p>
                                        <h1 className="text-3xl font-extrabold text-gray-900">{cameraData.name}</h1>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyle(isOnline ? 'online' : 'offline')}`}>
                                            {getStatusIcon(isOnline ? 'online' : 'offline')}
                                            <span className="font-bold text-xs uppercase tracking-wide">
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>

                                        {!isOnline && (
                                            <span className="text-xs font-medium text-gray-500">
                                                Last seen {formatDateAndTime(lastActivity || cameraData.lastSeen)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1">

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Serial Number</p>
                                    <div className="inline-block bg-gray-100 border-2 border-gray-300 rounded px-4 py-2">
                                        <span className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                                            {cameraData.serialNumber}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Apprehension Timer</p>
                                    <span className="font-sm text-gray-700">{cameraData?.config?.apprehensionTimer} seconds</span>
                                </div>

                                {/* Servo Controls (D-PAD) */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Camera Position</p>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor()}`}>
                                            {getCameraStatusLabel()}
                                        </span>
                                    </div>

                                    <div className={`flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-inner ${!isOnline ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Top Row */}
                                            <div></div>
                                            <button
                                                onClick={() => handleServoNudge('tilt', -1)}
                                                disabled={isControlDisabled}
                                                className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                                title="Tilt Up"
                                            >
                                                <ChevronUp size={24} className="text-gray-700" />
                                            </button>
                                            <div></div>

                                            {/* Middle Row */}
                                            <button
                                                onClick={() => handleServoNudge('pan', 1)}
                                                disabled={isControlDisabled}
                                                className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                                title="Pan Left"
                                            >
                                                <ChevronLeft size={24} className="text-gray-700" />
                                            </button>

                                            {/* Center Panel (Shows Spinner while moving) */}
                                            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-200/50 shadow-sm w-full min-w-[70px] min-h-[60px]">
                                                {isServoMoving ? (
                                                    <>
                                                        <RefreshCw className="animate-spin text-blue-500 mb-1" size={16} />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Wait</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Angle</span>
                                                        <span className="text-xs font-mono text-gray-700">P:{servoState.pan}°</span>
                                                        <span className="text-xs font-mono text-gray-700">T:{servoState.tilt}°</span>
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleServoNudge('pan', -1)}
                                                disabled={isControlDisabled}
                                                className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                                title="Pan Right"
                                            >
                                                <ChevronRight size={24} className="text-gray-700" />
                                            </button>

                                            {/* Bottom Row */}
                                            <div></div>
                                            <button
                                                onClick={() => handleServoNudge('tilt', 1)}
                                                disabled={isControlDisabled}
                                                className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                                                title="Tilt Down"
                                            >
                                                <ChevronDown size={24} className="text-gray-700" />
                                            </button>
                                            <div></div>
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