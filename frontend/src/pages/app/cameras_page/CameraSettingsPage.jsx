import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Save, RefreshCw, Trash2, Power, CheckCircle, Video, XCircle
} from 'lucide-react';
import api from "../../../lib/axios";
import Navbar from "../../../components/Navbar";
import toast from 'react-hot-toast';

const CameraSettingsPage = () => {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Connection State
    const [isOnline, setIsOnline] = useState(false);
    const [lastActivity, setLastActivity] = useState(0);

    // Stream State
    const [hasImage, setHasImage] = useState(false);
    const imgRef = useRef(null);
    const previousUrl = useRef(null);

    // Config State (Servo removed)
    const [config, setConfig] = useState({
        streamEnabled: false,
        streamResolution: 1,
        apprehensionTimer: 3000,
        zoneEnabled: false,
        polyX: [0, 100, 100, 0],
        polyY: [0, 0, 100, 100]
    });

    const [tempPoints, setTempPoints] = useState([]);
    const containerRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/api/cameras/get/${serialNumber}`);
                if (res.data && res.data.config) {
                    setConfig(res.data.config);
                    const points = res.data.config.polyX.map((x, i) => ({
                        x: x,
                        y: res.data.config.polyY[i]
                    }));
                    setTempPoints(points);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serialNumber]);

    // --- WEBSOCKET STREAM & STATUS LOGIC ---
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = "sentryai.onrender.com";
        const wsUrl = `${protocol}//${host}?type=viewer&serial=${serialNumber}`;

        const ws = new WebSocket(wsUrl);
        ws.binaryType = "blob";

        ws.onclose = () => {
            // We don't instantly set online to false here to prevent flickering.
            // Let the watchdog timer handle the actual "offline" state after a delay.
        };

        ws.onerror = () => {
            // Same here, rely on the watchdog.
        };

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                setIsOnline(true);
                setLastActivity(Date.now());

                const oldUrl = previousUrl.current;
                const newUrl = URL.createObjectURL(event.data);

                previousUrl.current = newUrl;
                if (imgRef.current) imgRef.current.src = newUrl;

                // Delay revoking the old URL by 100ms so the browser has time to paint the new one.
                if (oldUrl) {
                    setTimeout(() => URL.revokeObjectURL(oldUrl), 100);
                }
            }
        };

        // --- IMPROVED WATCHDOG TIMER ---
        // Check every 500ms, but only declare offline if 2.5 seconds have passed without a frame.
        // This easily bridges the gap between slow frames and prevents UI flashing.
        const intervalId = setInterval(() => {
            const now = Date.now();
            if (lastActivity !== 0 && (now - lastActivity > 15000)) {
                setIsOnline(false);
            }
        }, 500);

        return () => {
            clearInterval(intervalId);
            if (ws.readyState === 1) ws.close();
            if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
        };
    }, [serialNumber, lastActivity]);


    // --- HANDLERS ---
    const handleImageClick = (e) => {
        // Use the smoothed 'isOnline' state
        if (!isOnline) return;
        if (!containerRef.current) return;
        if (tempPoints.length >= 4) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newPoints = [...tempPoints, { x: Math.round(x), y: Math.round(y) }];
        setTempPoints(newPoints);

        if (newPoints.length === 4) {
            setConfig(prev => ({
                ...prev,
                polyX: newPoints.map(p => p.x),
                polyY: newPoints.map(p => p.y)
            }));
        }
    };

    const resetPolygon = () => {
        if (!isOnline) return;
        setTempPoints([]);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked;
        } else if (type === 'number' || name === 'streamResolution') {
            // Force conversion to a clean integer, fallback to 0 if NaN
            finalValue = parseInt(value, 10) || 0;
        }

        setConfig(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalConfig = { ...config };
            if (tempPoints.length === 4) {
                finalConfig.polyX = tempPoints.map(p => p.x);
                finalConfig.polyY = tempPoints.map(p => p.y);
            }
            await api.put(`/api/cameras/config/${serialNumber}`, finalConfig);
            navigate(-1);
            toast.success(`Settings saved and pushed to ${serialNumber}`);
        } catch (err) {
            console.error("Save failed", err);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Configuration...</div>;

    const pointsString = tempPoints.map(p => `${p.x},${p.y}`).join(' ');

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

                    {/* ================= LEFT COLUMN ================= */}
                    <div className="flex items-center justify-center h-min w-full">
                        <div className="w-full flex flex-col gap-4">
                            <div
                                ref={containerRef}
                                className={`mx-auto relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-lg select-none group ${isOnline ? 'cursor-crosshair' : 'cursor-not-allowed opacity-80'}`}
                                onClick={handleImageClick}
                            >
                                <img
                                    ref={imgRef}
                                    alt="Live Stream"
                                    className={`w-full h-full object-cover pointer-events-none ${hasImage ? 'block' : 'hidden'}`}
                                    onLoad={() => setHasImage(true)}
                                    onError={() => setHasImage(false)}
                                />

                                {/* Fallback if no image has EVER loaded */}
                                {!hasImage && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                                        <p>{isOnline ? "Waiting for Stream..." : "Camera Offline"}</p>
                                    </div>
                                )}

                                {/* Overlay Badge if offline but showing last frame */}
                                {!isOnline && hasImage && (
                                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                        <div className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                            <XCircle size={12} /> Offline (Last Frame)
                                        </div>
                                    </div>
                                )}

                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {tempPoints.length > 0 && (
                                        <polygon
                                            points={pointsString}
                                            fill="rgba(37, 99, 235, 0.3)"
                                            stroke="#2563eb"
                                            strokeWidth="0.8"
                                        />
                                    )}
                                    {tempPoints.map((p, i) => (
                                        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="white" stroke="#2563eb" strokeWidth="0.5" />
                                    ))}
                                </svg>

                                <div className="absolute top-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); resetPolygon(); }}
                                        disabled={!isOnline}
                                        className="bg-white/90 hover:bg-red-50 text-red-600 p-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} /> Reset
                                    </button>
                                </div>

                                <div className="absolute bottom-4 left-4 pointer-events-none">
                                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg shadow-sm">
                                        {tempPoints.length === 4
                                            ? <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> Zone Set</span>
                                            : `Click Point ${tempPoints.length + 1}/4`}
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-sm text-gray-500">
                                {isOnline ? "Click 4 corners on the video to define the detection zone." : "Connect camera to edit zone."}
                            </p>
                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN ================= */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Camera Configuration</p>
                                    <h1 className="text-3xl font-extrabold text-gray-900">{serialNumber}</h1>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 btn btn-primary text-white rounded-lg disabled:opacity-50 font-medium shadow-sm transition-all"
                                >
                                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* 1. System Toggles */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">System Control</h3>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.streamEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                                <Power size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">Camera Stream</p>
                                                <p className="text-xs text-gray-500">Enable video transmission</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="streamEnabled"
                                                checked={config.streamEnabled}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Resolution Dropdown */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                <Video size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">Resolution</p>
                                                <p className="text-xs text-gray-500">Quality vs Speed</p>
                                            </div>
                                        </div>
                                        <select
                                            name="streamResolution"
                                            value={config.streamResolution || 1}
                                            onChange={handleChange}
                                            disabled={!config.streamEnabled}
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:bg-gray-100 disabled:text-gray-400 outline-none"
                                        >
                                            <option value={0}>120x120 (Low)</option>
                                            <option value={1}>240x240 (Medium)</option>
                                            <option value={2}>320x320 (High)</option>
                                            <option value={3}>480x480 (Ultra)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.zoneEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                                <RefreshCw size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">Zone Detection</p>
                                                <p className="text-xs text-gray-500">Only detect inside polygon</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="zoneEnabled"
                                                checked={config.zoneEnabled}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* 2. Timer Settings */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Parameters</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Apprehension Timer (seconds)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="apprehensionTimer"
                                                value={config.apprehensionTimer}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                                placeholder="60"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <span className="text-gray-400 font-bold text-xs">secs</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Time an object must stay in zone to trigger alert.</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraSettingsPage;