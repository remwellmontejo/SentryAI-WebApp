import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import api from '../../lib/axios';

const getSquarePosition = (x, y) => {
    return {
        x: Math.max(0, Math.min(100, x)) + '%',
        y: Math.max(0, Math.min(100, y)) + '%'
    };
};

const PublicApprehensionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const vehicleIds = location.state?.vehicleIds || [];

    // Find current index
    const currentIndex = vehicleIds.findIndex(vid => vid === id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < vehicleIds.length - 1;

    const handlePrevious = () => {
        if (hasPrevious) {
            navigate(`/public-details/${vehicleIds[currentIndex - 1]}`, { state: { vehicleIds }, replace: true });
        }
    };

    const handleNext = () => {
        if (hasNext) {
            navigate(`/public-details/${vehicleIds[currentIndex + 1]}`, { state: { vehicleIds }, replace: true });
        }
    };

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const AI_INPUT_SIZE = 480;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/public/details/${id}`);
                setVehicle(response.data.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Record not found or not yet approved.');
                } else {
                    setError('An error occurred while fetching details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50" data-theme="corporateBlue">
            {/* Header */}
            <div className="bg-white shadow-lg">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <SentryAILogo className="w-10 h-10" />
                        <span className="text-2xl font-bold text-gray-900 hidden sm:inline">SentryAI</span>
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                {/* Pagination Controls */}
                {vehicleIds.length > 1 && !error && (
                    <div className="flex items-center justify-end mb-6 gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={!hasPrevious || loading}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg border font-medium transition-colors ${hasPrevious && !loading
                                    ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm'
                                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? <Loader size={18} className="animate-spin" /> : <ChevronLeft size={18} />} Previous
                        </button>
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-sm font-bold text-gray-600">
                            {currentIndex + 1} / {vehicleIds.length}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={!hasNext || loading}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg border font-medium transition-colors ${hasNext && !loading
                                    ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm'
                                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Next {loading ? <Loader size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                )}

                {/* Loading State for initial fetch */}
                {loading && !vehicle && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader size={48} className="text-primary animate-spin mb-4" />
                        <p className="text-gray-500 text-lg font-medium">Loading details...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-700 mb-2">Error</h3>
                        <p className="text-red-500 mb-6">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>
                )}

                {/* Vehicle Details */}
                {!error && vehicle && (
                    <div className="grid lg:grid-cols-2 gap-8 lg:items-center relative">
                        {/* Inner Loader when fetching next/prev data */}
                        {loading && (
                            <div className="absolute inset-0 bg-gray-50/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
                                <Loader size={48} className="text-blue-600 animate-spin" />
                            </div>
                        )}

                        {/* LEFT: IMAGE SECTION */}
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

                        {/* RIGHT: DETAILS SECTION */}
                        <div className="flex flex-col h-min">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">

                                <div className="p-6 border-b border-gray-200 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                                            <h1 className="text-3xl font-extrabold text-gray-900">{vehicle.vehicleType}</h1>
                                        </div>
                                        <div className="text-right items-center justify-center pt-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${vehicle.status === 'Resolved'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-100 text-red-700 border border-red-200'
                                                }`}>
                                                {vehicle.status === 'Approved' ? 'Not Resolved' : vehicle.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
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
                                </div>

                                {/* Footer Info */}
                                <div className="p-4 bg-blue-50 border-t border-blue-100">
                                    <p className="text-blue-700 font-medium text-sm text-center">
                                        If you believe there is an error, please visit the Traffic Management Office of Talon Kuatro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicApprehensionDetailsPage;
