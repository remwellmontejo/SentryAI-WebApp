import Navbar from "../../../components/Navbar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import React, { useState, useEffect } from 'react';
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
    const [cameraData, setCameraData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/api/cameras/get/${serialNumber}`);
                setCameraData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details:", err);
                setError("Failed to load camera details.");
                setLoading(false);
            }
        };
        fetchDetails();
    }, [serialNumber]);

    // State to handle stream loading
    const [isStreamLoaded, setIsStreamLoaded] = useState(false);
    const [streamError, setStreamError] = useState(false);

    const isOnline = () => {
        return cameraData.status === 'online' ? true : false;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-500 font-medium">Loading Camera Details...</p>
                </div>
            </div>
        );
    }
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
                    <div className=" bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden relative p-5">

                        {/* Live Status Indicator */}
                        <div className={`absolute top-8 left-8 z-20 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}>
                            <span className={`block w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-300'}`}></span>
                            {isOnline ? 'LIVE STREAM' : 'OFFLINE'}
                        </div>

                        <div className="w-full h-full bg-gray-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
                            {/* The MJPEG Stream Image */}
                            <img
                                src={serialNumber}
                                alt="Live Camera Stream"
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isStreamLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setIsStreamLoaded(true)}
                                onError={() => {
                                    setIsStreamLoaded(false);
                                    setStreamError(true);
                                }}
                            />

                            {/* Loading / Error State Overlay */}
                            {!isStreamLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-4">
                                    {streamError ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.121-3.536m-1.414-1.414L3 3m0 0l2.829 2.829m0 0L3 3m2.829 2.829a9 9 0 0112.728 0" />
                                            </svg>
                                            <p className="font-medium">Stream Unavailable</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="animate-spin h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="font-medium tracking-wide">Connecting to Camera...</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
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