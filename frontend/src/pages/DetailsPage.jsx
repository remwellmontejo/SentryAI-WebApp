import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import api from "../lib/axios.js";
import Navbar from "../components/Navbar";

const getSquarePosition = (x, y, modelSize) => {
    const percentX = ((x - 24) / modelSize) * 100;
    const percentY = ((y - 24) / modelSize) * 100;

    return {
        // Clamp between 0-100% to keep marker inside the box
        x: Math.max(0, Math.min(100, percentX)) + '%',
        y: Math.max(0, Math.min(100, percentY)) + '%'
    };
};

// --- HELPER: STATUS COLORS ---
const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return "bg-green-100 text-green-800 border-green-200";
        case 'rejected': return "bg-red-100 text-red-800 border-red-200";
        case 'pending':
        default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return <CheckCircle size={16} />;
        case 'rejected': return <XCircle size={16} />;
        default: return <AlertCircle size={16} />;
    }
};

const DetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const AI_INPUT_SIZE = 240;
    const IMG_WIDTH = 1600;
    const IMG_HEIGHT = 1200;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/api/apprehended-vehicle/${id}`);
                setVehicle(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details:", err);
                setError("Failed to load vehicle details.");
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!vehicle) return <div className="min-h-screen flex items-center justify-center">No Data</div>;

    const locationString = vehicle.x_coordinate && vehicle.y_coordinate
        ? `X: ${vehicle.x_coordinate}, Y: ${vehicle.y_coordinate}`
        : "Unknown";

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
                    {/* --- LEFT: IMAGE SECTION (Square Crop) --- */}
                    {vehicle.sceneImageBase64 ? (
                        <div className="bg-white">
                            {/* aspect-square: Forces 1:1 ratio
                                    object-cover: Cuts off the extra width to fill the square
                                    relative: Allows absolute positioning of the dot
                                */}
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={`data:image/jpeg;base64,${vehicle.sceneImageBase64}`}
                                    alt="Apprehension Scene"
                                    className="w-full h-full object-cover"
                                />

                                {/* The Centroid Marker */}
                                {vehicle.x_coordinate !== undefined && vehicle.y_coordinate !== undefined && (() => {
                                    // Standard Top-Left Logic
                                    const pos = getSquarePosition(vehicle.x_coordinate, vehicle.y_coordinate, AI_INPUT_SIZE);
                                    return (
                                        <div
                                            className="absolute w-4 h-4 border-2 border-red-500 rounded-full bg-red-500/20 shadow-[0_0_10px_rgba(255,0,0,0.5)] z-10 pointer-events-none transition-all duration-500"
                                            style={{
                                                left: pos.x,
                                                top: pos.y,
                                                transform: 'translate(-50%, -50%)' // Centers the dot on the exact pixel
                                            }}
                                        >
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                                                {vehicle.confidenceScore}%
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg border border-gray-300">
                            No Evidence Image
                        </div>
                    )}

                    {/* --- RIGHT: DETAILS SECTION (New styling applied) --- */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">

                            {/* Card Header: Type & Status */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                                        <h1 className="text-3xl font-extrabold text-gray-900">{vehicle.vehicleType}</h1>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyle(vehicle.status)}`}>
                                        {getStatusIcon(vehicle.status)}
                                        <span className="font-bold text-xs uppercase tracking-wide">{vehicle.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body: Info Grid */}
                            <div className="p-6 space-y-6 flex-1">

                                {/* Plate Number */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">License Plate</p>
                                    <div className="inline-block bg-gray-100 border-2 border-gray-300 rounded px-4 py-2">
                                        <span className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                                            {vehicle.plateNumber || "NO-PLATE"}
                                        </span>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Calendar size={16} />
                                            <span className="text-xs font-bold uppercase">Date</span>
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">{formatDate(vehicle.createdAt)}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Clock size={16} />
                                            <span className="text-xs font-bold uppercase">Time</span>
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">{formatTime(vehicle.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="grid grid-rows-2 gap-y-2 pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase block mb-1">Confidence Level</span>
                                        <span className="font-medium text-gray-700">{vehicle.confidenceScore}%</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase block mb-1">Centroid Location</span>
                                        <div className="flex items-center gap-1 text-gray-600 font-mono text-sm">
                                            <MapPin size={12} />
                                            {locationString}
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
    );
};

export default DetailsPage;