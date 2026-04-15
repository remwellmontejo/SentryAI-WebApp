import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Save, RefreshCw, Trash2, Power, CheckCircle, Video, XCircle, Loader, Pencil, Plus
} from 'lucide-react';
import api from "../../../lib/axios";
import Navbar from "../../../components/Navbar";
import toast from 'react-hot-toast';

const ZONE_COLORS = [
    { fill: 'rgba(255, 0, 0, 0.30)', stroke: '#ef4444', dot: '#ef4444', label: 'Zone 1', bg: 'bg-red-100 text-red-700 border-red-200', activeBg: 'bg-red-600 text-white', dotClass: 'bg-red-500' },
    { fill: 'rgba(37, 99, 235, 0.30)', stroke: '#2563eb', dot: '#2563eb', label: 'Zone 2', bg: 'bg-blue-100 text-blue-700 border-blue-200', activeBg: 'bg-blue-600 text-white', dotClass: 'bg-blue-500' },
    { fill: 'rgba(16, 185, 129, 0.30)', stroke: '#10b981', dot: '#10b981', label: 'Zone 3', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', activeBg: 'bg-emerald-600 text-white', dotClass: 'bg-emerald-500' },
];

const MAX_ZONES = 3;
const POINTS_PER_ZONE = 6;

const CameraSettingsPage = () => {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cameraName, setCameraName] = useState('');

    // Connection State
    const [isOnline, setIsOnline] = useState(false);
    const [lastActivity, setLastActivity] = useState(0);

    // Stream State
    const [hasImage, setHasImage] = useState(false);
    const imgRef = useRef(null);
    const previousUrl = useRef(null);

    // Config State (non-zone settings)
    const [config, setConfig] = useState({
        streamEnabled: false,
        streamResolution: 1,
        apprehensionTimer: 3000,
    });

    // Multi-Zone State
    const [zones, setZones] = useState([]); // Array of { enabled, points: [{x,y}] }
    const [activeZoneIndex, setActiveZoneIndex] = useState(0);

    const containerRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/api/cameras/get/${serialNumber}`);
                if (res.data && res.data.config) {
                    setCameraName(res.data.name || '');
                    setConfig({
                        streamEnabled: res.data.config.streamEnabled,
                        streamResolution: res.data.config.streamResolution,
                        apprehensionTimer: res.data.config.apprehensionTimer,
                    });

                    // Load zones
                    const loadedZones = (res.data.config.zones || []).map(z => ({
                        enabled: z.enabled,
                        points: (z.polyX || []).map((x, i) => ({ x, y: z.polyY[i] }))
                    }));
                    setZones(loadedZones);
                    if (loadedZones.length > 0) setActiveZoneIndex(0);
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

        ws.onclose = () => {};
        ws.onerror = () => {};

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                setIsOnline(true);
                setLastActivity(Date.now());

                const oldUrl = previousUrl.current;
                const newUrl = URL.createObjectURL(event.data);

                previousUrl.current = newUrl;
                if (imgRef.current) imgRef.current.src = newUrl;

                if (oldUrl) {
                    setTimeout(() => URL.revokeObjectURL(oldUrl), 100);
                }
            }
        };

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

    // --- ZONE HANDLERS ---
    const addZone = () => {
        if (zones.length >= MAX_ZONES) return;
        const newZones = [...zones, { enabled: true, points: [] }];
        setZones(newZones);
        setActiveZoneIndex(newZones.length - 1);
    };

    const removeZone = (idx) => {
        const newZones = zones.filter((_, i) => i !== idx);
        setZones(newZones);
        if (activeZoneIndex >= newZones.length) {
            setActiveZoneIndex(Math.max(0, newZones.length - 1));
        }
    };

    const toggleZoneEnabled = (idx) => {
        setZones(prev => prev.map((z, i) => i === idx ? { ...z, enabled: !z.enabled } : z));
    };

    const handleImageClick = (e) => {
        if (!isOnline) return;
        if (!containerRef.current) return;
        if (zones.length === 0) return;

        const zone = zones[activeZoneIndex];
        if (!zone || zone.points.length >= POINTS_PER_ZONE) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setZones(prev => prev.map((z, i) => {
            if (i !== activeZoneIndex) return z;
            return { ...z, points: [...z.points, { x: Math.round(x), y: Math.round(y) }] };
        }));
    };

    const resetActiveZone = () => {
        if (!isOnline) return;
        setZones(prev => prev.map((z, i) => {
            if (i !== activeZoneIndex) return z;
            return { ...z, points: [] };
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked;
        } else if (name === 'streamResolution') {
            const parsedValue = parseInt(value, 10);
            finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        } else if (type === 'number') {
            finalValue = value === '' ? '' : parseInt(value, 10);
        }

        setConfig(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleSave = async () => {
        // Validate: every enabled zone must have exactly 6 points
        for (let i = 0; i < zones.length; i++) {
            if (zones[i].enabled && zones[i].points.length < POINTS_PER_ZONE) {
                toast.error(`${ZONE_COLORS[i].label} is enabled but only has ${zones[i].points.length}/${POINTS_PER_ZONE} points. Plot all points or disable the zone.`);
                setActiveZoneIndex(i);
                return;
            }
        }

        setSaving(true);
        try {
            // Convert zones to the backend format
            const zonesPayload = zones.map(z => ({
                enabled: z.enabled,
                polyX: z.points.map(p => p.x),
                polyY: z.points.map(p => p.y),
            }));

            await api.put(`/api/cameras/config/${serialNumber}`, {
                name: cameraName,
                ...config,
                zones: zonesPayload,
            });
            navigate(-1);
            toast.success(`Settings saved and pushed to ${serialNumber}`);
        } catch (err) {
            console.error("Save failed", err);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    // --- VALIDATION ---
    const hasInvalidZones = zones.some(z => z.enabled && z.points.length < POINTS_PER_ZONE);
    const activeZone = zones[activeZoneIndex];

    if (loading) return <div className="min-h-screen flex flex-col items-center justify-center"><Loader size={48} className="text-primary animate-spin mb-4" /><p className="text-gray-500 text-lg font-medium">Loading configuration...</p></div>;

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

                                {!hasImage && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                                        <p>{isOnline ? "Waiting for Stream..." : "Camera Offline"}</p>
                                    </div>
                                )}

                                {!isOnline && hasImage && (
                                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                        <div className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                            <XCircle size={12} /> Offline (Last Frame)
                                        </div>
                                    </div>
                                )}

                                {/* Draw ALL zones */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {zones.map((zone, zIdx) => {
                                        if (zone.points.length === 0) return null;
                                        const color = ZONE_COLORS[zIdx];
                                        const isActive = zIdx === activeZoneIndex;
                                        const pts = zone.points.map(p => `${p.x},${p.y}`).join(' ');
                                        return (
                                            <React.Fragment key={zIdx}>
                                                <polygon
                                                    points={pts}
                                                    fill={color.fill}
                                                    stroke={color.stroke}
                                                    strokeWidth={isActive ? "1.2" : "0.5"}
                                                    strokeDasharray={isActive ? "none" : "2,1"}
                                                />
                                                {zone.points.map((p, i) => (
                                                    <circle
                                                        key={i}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={isActive ? "1.5" : "1"}
                                                        fill="white"
                                                        stroke={color.stroke}
                                                        strokeWidth="0.5"
                                                    />
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </svg>

                                {/* Reset Button */}
                                <div className="absolute top-2 right-2 pointer-events-auto sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); resetActiveZone(); }}
                                        disabled={!isOnline || zones.length === 0}
                                        className="bg-white/90 hover:bg-red-50 text-red-600 p-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} /> Reset
                                    </button>
                                </div>

                                {/* Bottom Left Status Text */}
                                <div className="absolute bottom-4 left-4 pointer-events-none">
                                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg shadow-sm">
                                        {zones.length === 0
                                            ? <span className="text-gray-400">Add a zone to start</span>
                                            : activeZone?.points.length === POINTS_PER_ZONE
                                                ? <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> {ZONE_COLORS[activeZoneIndex].label} Set</span>
                                                : `${ZONE_COLORS[activeZoneIndex]?.label}: Point ${(activeZone?.points.length || 0) + 1}/${POINTS_PER_ZONE}`}
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-sm text-gray-500">
                                {isOnline
                                    ? zones.length === 0
                                        ? "Add a zone below, then click 6 corners to define it."
                                        : `Click 6 corners on the video to define ${ZONE_COLORS[activeZoneIndex]?.label}.`
                                    : "Connect camera to edit zones."}
                            </p>

                            {/* Zone Tabs */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {zones.map((zone, idx) => {
                                    const color = ZONE_COLORS[idx];
                                    const isActive = idx === activeZoneIndex;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveZoneIndex(idx)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-all ${isActive ? color.activeBg + ' border-transparent shadow-md' : 'bg-white ' + color.bg}`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white' : color.dotClass}`}></span>
                                            {color.label}
                                            {zone.enabled
                                                ? <CheckCircle size={14} className={isActive ? 'text-white/80' : ''} />
                                                : <XCircle size={14} className={isActive ? 'text-white/60' : 'opacity-50'} />
                                            }
                                        </button>
                                    );
                                })}
                                {zones.length < MAX_ZONES && (
                                    <button
                                        onClick={addZone}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-all"
                                    >
                                        <Plus size={16} /> Add Zone
                                    </button>
                                )}
                            </div>
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
                                    disabled={saving || hasInvalidZones}
                                    title={hasInvalidZones ? 'Some enabled zones are incomplete' : ''}
                                    className="flex items-center gap-2 px-4 py-2 btn btn-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                                >
                                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Camera Name */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Camera Identity</h3>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                <Pencil size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">Camera Name</p>
                                                <p className="text-xs text-gray-500">Display name</p>
                                            </div>
                                        </div>
                                        <div className="w-1/2">
                                            <input
                                                type="text"
                                                value={cameraName}
                                                onChange={(e) => setCameraName(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                                                placeholder="Camera Name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* System Toggles */}
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
                                            value={config.streamResolution ?? 1}
                                            onChange={handleChange}
                                            disabled={!config.streamEnabled}
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:bg-gray-100 disabled:text-gray-400 outline-none"
                                        >
                                            <option value={0}>240x240 (Medium)</option>
                                            <option value={1}>480x480 (High)</option>
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* Zone Settings Per Active Zone */}
                                {zones.length > 0 && activeZone && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                                {ZONE_COLORS[activeZoneIndex].label} Settings
                                            </h3>
                                            <button
                                                onClick={() => removeZone(activeZoneIndex)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${activeZone.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    <RefreshCw size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-700">Zone Enabled</p>
                                                    <p className="text-xs text-gray-500">Only detect inside this polygon</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={activeZone.enabled}
                                                    onChange={() => toggleZoneEnabled(activeZoneIndex)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-600">Points Plotted</p>
                                                <span className={`text-sm font-bold ${activeZone.points.length === POINTS_PER_ZONE ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {activeZone.points.length} / {POINTS_PER_ZONE}
                                                </span>
                                            </div>
                                            {activeZone.enabled && activeZone.points.length < POINTS_PER_ZONE && (
                                                <p className="text-xs text-amber-600 mt-1">⚠ Click {POINTS_PER_ZONE - activeZone.points.length} more point(s) on the video to complete this zone.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <hr className="border-gray-200" />

                                {/* Timer Settings */}
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