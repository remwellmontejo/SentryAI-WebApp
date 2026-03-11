import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, RefreshCw, Car, Hash, Activity, AlertTriangle, Loader } from 'lucide-react';
import api from "../../../lib/axios";
import Navbar from "../../../components/Navbar";
import toast from 'react-hot-toast';

// --- HELPER: Positioning for the visual box ---
const getSquarePosition = (x, y) => {
    return {
        x: Math.max(0, Math.min(100, x)) + '%',
        y: Math.max(0, Math.min(100, y)) + '%'
    };
};

const EditApprehensionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Image Data (Read Only)
    const [imageData, setImageData] = useState({
        base64: null,
        x: 0,
        y: 0,
        confidence: 0
    });

    // Editable Form Data (Strictly based on Schema)
    const [formData, setFormData] = useState({
        plateNumber: '',
        vehicleType: 'Car',
        status: 'Pending'
    });

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/api/apprehended-vehicle/${id}`);
                const data = res.data;

                // Set Image Context
                setImageData({
                    base64: data.sceneImageBase64,
                    x: data.x_coordinate,
                    y: data.y_coordinate,
                    confidence: data.confidenceScore
                });

                // Set Form Data
                setFormData({
                    plateNumber: data.plateNumber || '',
                    vehicleType: data.vehicleType || 'Car',
                    status: data.status || 'Pending'
                });

                setLoading(false);
            } catch (err) {
                console.error("Failed to load details", err);
                toast.error("Failed to load apprehension details.");
                navigate(-1);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading("Saving changes...");
        try {
            // Only sending the fields allowed by the schema
            await api.patch(`/api/apprehended-vehicle/${id}/update`, {
                plateNumber: formData.plateNumber.toUpperCase(), // Ensure Uppercase
                vehicleType: formData.vehicleType,
                status: formData.status
            });

            toast.success("Record updated successfully", { id: toastId });

            // Navigate back after short delay
            setTimeout(() => navigate(-1), 500);

        } catch (err) {
            console.error("Save failed", err);
            toast.error("Failed to save changes.", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader size={48} className="text-primary animate-spin mb-4" /><p className="text-gray-500 text-lg font-medium">Loading editor...</p></div>;

    // Calculate dot position
    const pos = getSquarePosition(imageData.x, imageData.y);

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

                    {/* ================= LEFT COLUMN: EVIDENCE IMAGE ================= */}
                    <div className="flex items-center justify-center h-min w-full">
                        <div className="w-full flex flex-col gap-4">
                            <div className="bg-white">
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    {imageData.base64 ? (
                                        <>
                                            <img
                                                src={`data:image/jpeg;base64,${imageData.base64}`}
                                                alt="Evidence"
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Visual Marker */}
                                            {imageData.x !== undefined && imageData.y !== undefined && (
                                                <div
                                                    className="absolute w-4 h-4 border-2 border-red-500 rounded-full bg-red-500/20 shadow-[0_0_10px_rgba(255,0,0,0.5)] z-10 pointer-events-none transition-all duration-500"
                                                    style={{
                                                        left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                                                        {imageData.confidence}%
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <AlertTriangle size={32} />
                                            <p>No Image Available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-center text-sm text-gray-500">
                                This is the original evidence image. The location marker cannot be edited.
                            </p>
                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN: EDIT FORM ================= */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">

                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Editing Record</p>
                                    <h1 className="text-2xl font-extrabold text-gray-900 truncate max-w-[200px]">
                                        {formData.plateNumber || "NO PLATE"}
                                    </h1>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn btn-primary disabled:opacity-50 font-medium shadow-sm transition-all flex items-center gap-2"
                                >
                                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Record
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* 1. Identification Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Vehicle Details</h3>

                                    {/* Plate Number */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                <Hash size={20} />
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="font-bold text-gray-700">License Plate</p>
                                                <p className="text-xs text-gray-500">Official Registration</p>
                                            </div>
                                        </div>
                                        <div className="w-1/2">
                                            <input
                                                type="text"
                                                name="plateNumber"
                                                value={formData.plateNumber}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white font-mono uppercase text-right"
                                                placeholder="NO PLATE NUMBER FOUND"
                                            />
                                        </div>
                                    </div>

                                    {/* Vehicle Type (Restricted to Car/Motorcycle) */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                <Car size={20} />
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="font-bold text-gray-700">Vehicle Type</p>
                                                <p className="text-xs text-gray-500">Classification</p>
                                            </div>
                                        </div>
                                        <div className="w-1/2">
                                            <select
                                                name="vehicleType"
                                                value={formData.vehicleType}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                                            >
                                                <option value="Car">Car</option>
                                                <option value="Motorcycle">Motorcycle</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                <Activity size={20} />
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="font-bold text-gray-700">Record Status</p>
                                                <p className="text-xs text-gray-500">Current State</p>
                                            </div>
                                        </div>
                                        <div className="w-1/2">
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
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

export default EditApprehensionPage;