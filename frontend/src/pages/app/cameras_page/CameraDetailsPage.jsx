import Navbar from "../../../components/Navbar";
import { useNavigate, useParams } from "react-router";
import React, { useState, useEffect, useRef } from 'react';
import api from "../../../lib/axios.js";
import { useCameraStatus } from "../../../hooks/useCameraStatus";
import {
    CheckCircle, XCircle, ArrowLeft, Settings,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Loader
} from "lucide-react";
import BoundingPolygonOverlay from "../../../components/BoundingPolygonOverlay";
import toast from 'react-hot-toast';

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
        default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'online': return <CheckCircle size={16} />;
        case 'offline': return <XCircle size={16} />;
        default: return null;
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
    const debouncedServo = useDebounce(servoState, 500);
    const imgRef = useRef(null);
    const previousUrl = useRef(null);
    const [liveLogs, setLiveLogs] = useState([]);


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

    const isOnline = useCameraStatus(lastActivity) || cameraData?.status === 'online';

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
    const handleSliderChange = (axis, value) => {
        setServoState(prev => {
            if (!prev) return prev;
            return { ...prev, [axis]: parseInt(value, 10) };
        });
    };

    useEffect(() => {
        if (!cameraData || !debouncedServo) return;

        if (debouncedServo.pan === cameraData.config.servoPan &&
            debouncedServo.tilt === cameraData.config.servoTilt) {
            return;
        }

        const updateServo = async () => {
            // 1. Lock UI the moment the delay finishes and we send the request
            setIsServoMoving(true);

            // 2. Failsafe: Unlock after 10s if WebSocket packet is lost
            const failsafe = setTimeout(() => setIsServoMoving(false), 10000);

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
                clearTimeout(failsafe);
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
            // 2. Handle Text Messages (Lock/Unlock & Upload Status)
            else if (typeof event.data === "string") {
                try {
                    const data = JSON.parse(event.data);

                    // --- Handle Servo Movement ---
                    if (data.type === "servo_moving") {
                        setIsServoMoving(data.status); // true = loading/disabled, false = ready/enabled
                        if (data.status === false) {
                            console.log("Hardware confirmed servo movement complete.");
                        }
                    }

                    // --- NEW: Handle Upload Status ---
                    if (data.type === "upload_status") {
                        if (data.message === "capturing") {
                            // Show a loading toast that stays on screen
                            toast.loading("Camera is capturing an apprehension...", { id: 'capture_toast' });
                        }
                        else if (data.message === "complete") {
                            // Replace the loading toast with a success message
                            toast.success("Apprehension successfully uploaded!", { id: 'capture_toast' });
                        }
                        else if (data.message === "failed") {
                            // Replace the loading toast with an error message
                            toast.error("Capture or upload failed.", { id: 'capture_toast' });
                        }
                    }

                    if (data.type === "ai_logs") {
                        setLiveLogs(data.objects);
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

    if (!cameraData || !servoState) return <div className="min-h-screen flex flex-col items-center justify-center"><Loader size={48} className="text-primary animate-spin mb-4" /><p className="text-gray-500 text-lg font-medium">Loading camera...</p></div>;

    // --- BUTTON DISABLE LOGIC ---
    // Globally disabled if offline or currently moving
    const isControlDisabled = !isOnline || isServoMoving;

    // Specifically disable arrows if pushing them would break the 0-180 limits
    // Note: direction values match your `handleServoNudge` payload mapping (-1 or 1)
    const isTiltUpDisabled = isControlDisabled || (servoState.tilt - 10 < 0);
    const isTiltDownDisabled = isControlDisabled || (servoState.tilt + 10 > 180);
    const isPanLeftDisabled = isControlDisabled || (servoState.pan + 10 > 180);
    const isPanRightDisabled = isControlDisabled || (servoState.pan - 10 < 0);

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

                                {/* Servo Controls (Sliders) */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Camera Position</p>
                                        <div className="flex items-center gap-2">
                                            {/* Show spinner when locked */}
                                            {isServoMoving && <RefreshCw className="animate-spin text-blue-500" size={16} />}
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor()}`}>
                                                {getCameraStatusLabel()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-inner ${isControlDisabled ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>

                                        {/* PAN SLIDER */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-gray-700">Pan (Left/Right)</span>
                                                <span className={`text-sm font-mono ${isServoMoving ? 'text-blue-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                                                    {servoState?.pan ?? 90}°
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="45"
                                                max="135"
                                                value={servoState?.pan ?? 90}
                                                onChange={(e) => handleSliderChange('pan', e.target.value)}
                                                disabled={isControlDisabled}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:accent-gray-400 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                                                <span>45°</span>
                                                <span>135°</span>
                                            </div>
                                        </div>

                                        {/* TILT SLIDER */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-gray-700">Tilt (Up/Down)</span>
                                                <span className={`text-sm font-mono ${isServoMoving ? 'text-blue-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                                                    {servoState?.tilt ?? 90}°
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="30"
                                                max="100"
                                                value={servoState?.tilt ?? 90}
                                                onChange={(e) => handleSliderChange('tilt', e.target.value)}
                                                disabled={isControlDisabled}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:accent-gray-400 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                                                <span>30°</span>
                                                <span>100°</span>
                                            </div>
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