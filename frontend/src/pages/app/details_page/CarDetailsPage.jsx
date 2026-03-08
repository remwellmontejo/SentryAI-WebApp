import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin,
    AlertCircle, CheckCircle, XCircle, Check, X, RotateCcw, AlertTriangle, Loader
} from "lucide-react";
import toast from 'react-hot-toast';
import api from "../../../lib/axios.js";
import Navbar from "../../../components/Navbar.jsx";

// --- HELPERS ---
const getSquarePosition = (x, y) => {
    return {
        x: Math.max(0, Math.min(100, x)) + '%',
        y: Math.max(0, Math.min(100, y)) + '%'
    };
};

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

const CarDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // State for Custom Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const AI_INPUT_SIZE = 480;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/api/apprehended-vehicle/${id}`);
                setVehicle(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details:", err);
                toast.error("Failed to load vehicle details.");
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    // --- ACTION HANDLER ---
    const handleStatusUpdate = async (newStatus) => {
        if (!vehicle) return;

        const actionText = newStatus === 'Pending' ? 'Recovered' : newStatus;

        setActionLoading(true);
        const toastId = toast.loading("Updating status...");

        try {
            await api.patch(`/api/apprehended-vehicle/${id}/status`, { status: newStatus });
            setVehicle(prev => ({ ...prev, status: newStatus }));
            toast.success(`Vehicle successfully ${actionText}!`, { id: toastId });

            // Close modal if it was open
            setShowDeleteModal(false);
            navigate(-1);
        } catch (err) {
            console.error("Error updating status:", err);
            toast.error("Failed to update status.", { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // --- FORMATTERS ---
    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    if (loading) return <div className="min-h-screen flex flex-col items-center justify-center"><Loader size={48} className="text-primary animate-spin mb-4" /><p className="text-gray-500 text-lg font-medium">Loading details...</p></div>;
    if (!vehicle) return <div className="min-h-screen flex items-center justify-center">No Data</div>;

    const locationString = vehicle.x_coordinate !== undefined && vehicle.y_coordinate !== undefined
        ? `X: ${vehicle.x_coordinate}%, Y: ${vehicle.y_coordinate}%`
        : "Unknown";

    const currentStatus = vehicle.status?.toLowerCase() || 'pending';

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
                    {/* --- LEFT: IMAGE SECTION --- */}
                    {vehicle.sceneImageBase64 ? (
                        <div className="bg-white">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={`data:image/jpeg;base64,${vehicle.sceneImageBase64}`}
                                    alt="Apprehension Scene"
                                    className="w-full h-full object-cover"
                                />
                                {vehicle.x_coordinate !== undefined && vehicle.y_coordinate !== undefined && (() => {
                                    const pos = getSquarePosition(vehicle.x_coordinate, vehicle.y_coordinate);
                                    return (
                                        <div
                                            className="absolute w-4 h-4 border-2 border-red-500 rounded-full bg-red-500/20 shadow-[0_0_10px_rgba(255,0,0,0.5)] z-10 pointer-events-none transition-all duration-500"
                                            style={{
                                                left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)'
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

                    {/* --- RIGHT: DETAILS SECTION --- */}
                    <div className="flex flex-col h-min">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">

                            {/* Card Header: Type & Status */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                                        <h1 className="text-3xl font-extrabold text-gray-900">{vehicle.vehicleType}</h1>
                                    </div>

                                    {currentStatus !== 'approved' && (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyle(vehicle.status)}`}>
                                            {getStatusIcon(vehicle.status)}
                                            <span className="font-bold text-xs uppercase tracking-wide">{vehicle.status}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Body: Info Grid */}
                            <div className="p-6 space-y-6 flex-1">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">License Plate</p>
                                    <div className="inline-block bg-gray-100 border-2 border-gray-300 rounded px-4 py-2">
                                        <span className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                                            {vehicle.plateNumber || "NO-PLATE"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Calendar size={16} /> <span className="text-xs font-bold uppercase">Date</span>
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">{formatDate(vehicle.createdAt)}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Clock size={16} /> <span className="text-xs font-bold uppercase">Time</span>
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">{formatTime(vehicle.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-rows-2 gap-y-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Confidence Level</span>
                                        <span className="font-medium text-gray-700">{vehicle.confidenceScore}%</span>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Centroid Location</span>
                                        <div className="flex items-center gap-1 text-gray-600 font-medium text-sm">
                                            <MapPin size={12} /> {locationString}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Dynamic Action Buttons */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                {actionLoading ? (
                                    <div className="w-full text-center py-2 text-gray-500 text-sm animate-pulse">Processing...</div>
                                ) : (
                                    <>
                                        {/* CASE: PENDING */}
                                        {currentStatus === 'pending' && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate('Approved')}
                                                    className="btn btn-success flex items-center justify-center gap-2 text-white"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/apprehension/edit/${id}`)}
                                                    className="btn btn-primary flex items-center justify-center gap-2"
                                                >
                                                    <Edit size={16} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('Rejected')}
                                                    className="btn btn-error flex items-center justify-center gap-2 text-white"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        )}

                                        {/* CASE: APPROVED */}
                                        {currentStatus === 'approved' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => navigate(`/apprehension/edit/${id}`)}
                                                    className="btn btn-primary flex items-center justify-center gap-2">
                                                    <Edit size={16} /> Edit Details
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(true)} // Open Custom Modal
                                                    className="btn btn-error flex items-center justify-center gap-2 text-white"
                                                >
                                                    <Trash2 size={16} /> Delete Record
                                                </button>
                                            </div>
                                        )}

                                        {/* CASE: REJECTED */}
                                        {currentStatus === 'rejected' && (
                                            <div className="w-full">
                                                <button
                                                    onClick={() => handleStatusUpdate('Pending')}
                                                    className="btn btn-warning w-full flex items-center justify-center gap-2 text-white"
                                                >
                                                    <RotateCcw size={16} /> Recover to Pending
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- CUSTOM DELETE MODAL --- */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">

                            {/* Modal Header */}
                            <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Are you sure you want to remove this record? This will move the item to the <span className="font-semibold text-red-600">Rejected</span> list.
                                </p>
                            </div>

                            {/* Modal Actions */}
                            <div className="p-4 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 btn btn-ghost btn-outline text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    className="flex-1 btn btn-error text-white shadow-lg shadow-red-200"
                                >
                                    Yes, Delete it
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CarDetailsPage;