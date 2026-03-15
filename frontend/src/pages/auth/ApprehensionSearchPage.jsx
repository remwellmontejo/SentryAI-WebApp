import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Search, AlertTriangle, ArrowLeft, Car, Calendar, Clock, ShieldAlert, Loader, Eye } from 'lucide-react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import api from '../../lib/axios';

const ApprehensionSearchPage = () => {
    const { plateNumber } = useParams();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/public/search/${plateNumber}`);
                // Sort to put Not Resolved (Approved) cases at the top
                const sortedRecords = (response.data.data || []).sort((a, b) => {
                    const statusA = a.status === 'Approved' ? 'Not Resolved' : 'Resolved';
                    const statusB = b.status === 'Approved' ? 'Not Resolved' : 'Resolved';
                    if (statusA === 'Not Resolved' && statusB !== 'Not Resolved') return -1;
                    if (statusA !== 'Not Resolved' && statusB === 'Not Resolved') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt); // Secondary sort by date descending
                });
                setRecords(sortedRecords);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setRecords([]);
                } else {
                    setError('An error occurred while fetching records. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (plateNumber) {
            fetchRecords();
        }
    }, [plateNumber]);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50" data-theme="corporateBlue">
            {/* Header — background matches the SVG logo's green background */}
            <div className="bg-white shadow-lg">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <SentryAILogo className="w-10 h-10" />
                        <span className="text-2xl font-bold text-gray-900 hidden sm:inline">SentryAI</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        Search Again
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Plate Number Banner */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-red-100 text-red-600 p-4 rounded-xl">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Apprehension Records For</p>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-widest mt-1">
                                {plateNumber}
                            </h1>
                        </div>
                        {!loading && !error && (
                            <div className="sm:ml-auto">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${records.length > 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                    }`}>
                                    {records.length > 0
                                        ? `${records.length} Record${records.length > 1 ? 's' : ''} Found`
                                        : 'No Records Found'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader size={48} className="text-primary animate-spin mb-4" />
                        <p className="text-gray-500 text-lg font-medium">Searching records...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-700 mb-2">Something Went Wrong</h3>
                        <p className="text-red-500 mb-6">{error}</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            <Search size={18} />
                            Try Again
                        </Link>
                    </div>
                )}

                {/* No Records */}
                {!loading && !error && records.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h3 className="text-2xl font-bold text-green-700 mb-2">Good News!</h3>
                        <p className="text-green-600 mb-6">No approved apprehension records found for this plate number.</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Home
                        </Link>
                    </div>
                )}

                {/* Records Table */}
                {!loading && !error && records.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={20} className="text-red-500" />
                            <h2 className="text-lg font-bold text-gray-800">Violation Records</h2>
                        </div>

                        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-[#000060] text-white">
                                    <tr>
                                        <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Vehicle Type</th>
                                        <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Status</th>
                                        <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Date</th>
                                        <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Time</th>
                                        <th className="py-3 px-6 font-semibold text-center">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                    {records.map((record, index) => (
                                        <tr key={record._id || index} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-6 h-12 font-medium text-gray-900">{record.vehicleType || 'N/A'}</td>
                                            <td className="py-3 px-6 text-center h-12">
                                                <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-xs font-semibold ${
                                                    record.status === 'Resolved' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {record.status === 'Approved' ? 'Not Resolved' : record.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-center h-12">{formatDate(record.createdAt)}</td>
                                            <td className="py-3 px-6 text-center h-12">{formatTime(record.createdAt)}</td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <button
                                                    onClick={() => navigate(`/public-details/${record._id}`, { state: { vehicleIds: records.map(r => r._id) } })}
                                                    className="text-gray-500 hover:text-[#000060] transition-colors p-1 rounded-full hover:bg-blue-50"
                                                    title="View Photo Evidence & Full Details"
                                                >
                                                    <Eye size={24} className="mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer CTA */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mt-6">
                            <p className="text-blue-700 font-medium mb-1">
                                If you believe there is an error, please visit the Traffic Management Office of Talon Kuatro.
                            </p>
                            <p className="text-blue-500 text-sm">Bring a valid ID and a copy of your vehicle registration.</p>
                        </div>

                        <div className="text-center mt-4">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                            >
                                <Search size={18} />
                                Search Another Plate
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprehensionSearchPage;
