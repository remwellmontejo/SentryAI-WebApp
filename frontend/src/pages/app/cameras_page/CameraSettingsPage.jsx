import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, RefreshCw, Trash2, Power } from 'lucide-react';
import api from "../../../lib/axios"; // Your Axios instance
import Navbar from "../../../components/Navbar";

const CameraSettingsPage = () => {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        streamEnabled: false,
        apprehensionTimer: 3000,
        zoneEnabled: false,
        polyX: [0, 100, 100, 0],
        polyY: [0, 0, 100, 100],
        servoPan: 90,
        servoTilt: 90
    });

    // Helper for Polygon Editor
    const [tempPoints, setTempPoints] = useState([]); // Stores {x, y} objects during editing
    const imageRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/api/cameras/${serialNumber}`);
                if (res.data && res.data.config) {
                    setConfig(res.data.config);
                    // Reconstruct points for editor visualization
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

    // --- HANDLERS ---

    // 1. Polygon Click Handler
    const handleImageClick = (e) => {
        if (!imageRef.current) return;

        // Only allow editing if we have fewer than 4 points (or if we reset)
        if (tempPoints.length >= 4) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100; // 0-100%
        const y = ((e.clientY - rect.top) / rect.height) * 100; // 0-100%

        const newPoints = [...tempPoints, { x: Math.round(x), y: Math.round(y) }];
        setTempPoints(newPoints);

        // Update main config if we have 4 points
        if (newPoints.length === 4) {
            setConfig(prev => ({
                ...prev,
                polyX: newPoints.map(p => p.x),
                polyY: newPoints.map(p => p.y)
            }));
        }
    };

    const resetPolygon = () => {
        setTempPoints([]);
    };

    // 2. Generic Input Handler
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // 3. Save Handler
    const handleSave = async () => {
        setSaving(true);
        try {
            // Ensure we have exactly 4 points for the polygon
            const finalConfig = { ...config };
            if (tempPoints.length === 4) {
                finalConfig.polyX = tempPoints.map(p => p.x);
                finalConfig.polyY = tempPoints.map(p => p.y);
            }

            await api.put(`/api/cameras/config/${serialNumber}`, finalConfig);
            alert("Settings saved & pushed to Camera!");
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Configuration...</div>;

    // Construct Polygon Points String for SVG
    const pointsString = tempPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Camera Configuration</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">

                    {/* ================= LEFT: POLYGON EDITOR ================= */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Detection Zone</h2>
                            <button
                                onClick={resetPolygon}
                                className="text-sm flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                            >
                                <Trash2 size={16} /> Reset Points
                            </button>
                        </div>

                        {/* Interactive Image Container */}
                        <div
                            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-crosshair select-none"
                            onClick={handleImageClick}
                        >
                            {/* 1. Placeholder / Last Frame Image */}
                            {/* Ideally, fetch a snapshot URL if you have one. For now, we use a placeholder color or the stream URL if active */}
                            <img
                                ref={imageRef}
                                src="https://placehold.co/640x480/222/FFF?text=Camera+View" // Replace with actual stream/snapshot URL
                                alt="Camera View"
                                className="w-full h-full object-cover opacity-80"
                            />

                            {/* 2. SVG Overlay for Polygon */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* The Polygon Shape */}
                                {tempPoints.length > 0 && (
                                    <polygon
                                        points={pointsString}
                                        fill="rgba(37, 99, 235, 0.3)"
                                        stroke="#2563eb"
                                        strokeWidth="0.8"
                                    />
                                )}
                                {/* The Clicked Dots */}
                                {tempPoints.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="white" stroke="#2563eb" strokeWidth="0.5" />
                                ))}
                            </svg>

                            {/* 3. Instructions Overlay */}
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {tempPoints.length === 4
                                    ? "Zone Complete"
                                    : `Click to set point ${tempPoints.length + 1}/4`}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Reset points, then click 4 corners on the image to define the detection area.
                        </p>
                    </div>

                    {/* ================= RIGHT: CONTROLS ================= */}
                    <div className="space-y-6">

                        {/* 1. Hardware Toggles */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">System Status</h2>

                            <div className="space-y-4">
                                {/* Stream Toggle */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${config.streamEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Power size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Camera Stream</p>
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
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Zone Toggle */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${config.zoneEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <RefreshCw size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Zone Detection</p>
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
                        </div>

                        {/* 2. Servo Controls */}
                        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-opacity ${!config.streamEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Servo Position</h2>
                                {!config.streamEnabled && <span className="text-xs text-red-500 font-medium">Enable Stream to Edit</span>}
                            </div>

                            <div className="space-y-6">
                                {/* Pan Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Pan (Horizontal)</label>
                                        <span className="text-sm font-mono text-gray-500">{config.servoPan}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        name="servoPan"
                                        min="0" max="180"
                                        value={config.servoPan}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>0° (Left)</span>
                                        <span>180° (Right)</span>
                                    </div>
                                </div>

                                {/* Tilt Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Tilt (Vertical)</label>
                                        <span className="text-sm font-mono text-gray-500">{config.servoTilt}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        name="servoTilt"
                                        min="0" max="180"
                                        value={config.servoTilt}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>0° (Down)</span>
                                        <span>180° (Up)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Timer Config */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Parameters</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apprehension Timer (ms)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="apprehensionTimer"
                                        value={config.apprehensionTimer}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="3000"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">ms</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Time an object must stay in zone to trigger alert.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraSettingsPage;