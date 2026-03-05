import Navbar from '../../../components/Navbar.jsx'
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, View, Plus, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../../lib/axios.js";

const CamerasPage = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/api/cameras/get');
                setCameras(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toCameraDetailsPage = (cameraSerialNumber) => {
        navigate(`/cameras/${cameraSerialNumber}`);
    };

    // --- LOGIC: SEARCH ---
    const filteredCameras = cameras.filter((camera) => {
        const query = searchQuery.toLowerCase();

        const nameMatch = camera.name?.toLowerCase().includes(query);
        const serialMatch = camera.serialNumber?.toLowerCase().includes(query);
        const statusMatch = camera.status?.toLowerCase().includes(query);

        return nameMatch || serialMatch || statusMatch;
    });

    // --- LOGIC: PAGINATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCameras.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCameras.length / itemsPerPage);

    // --- HANDLERS ---
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to page 1 on search
    };

    return (
        <div className='min-h-screen' data-theme="corporateBlue">
            <div className='mb-5'>
                <Navbar />
            </div>
            <div className='mx-4 sm:mx-20'>
                <div className="w-full bg-white p-4 rounded-lg mt-6">

                    {/* --- Top Header Section --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">

                        {/* Title & Register Button Container */}
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-base-content">Cameras</h2>

                            {/* Expanding Register Button */}
                            <button
                                onClick={() => navigate('/cameras/register')} // Route adjusted
                                className="group flex items-center gap-0 hover:gap-2 p-2 border border-gray-400 rounded-md text-black hover:text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-300 overflow-hidden"
                                title="Register New Camera"
                            >
                                <Plus size={20} className="min-w-[20px]" />
                                <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-300 ease-in-out font-semibold text-sm">
                                    Register Camera
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto relative">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search Name, Serial..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-2 border border-gray-400 rounded-full w-full focus:outline-none focus:border-blue-900 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- The Table --- */}
                    <div className="border border-gray-300 rounded-t-lg overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-[#000060] text-white">
                                <tr>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Name</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Serial Number</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Status</th>
                                    <th className="py-3 px-6 font-semibold text-center">Details</th>
                                </tr>
                            </thead>

                            <tbody className="text-gray-700">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-12"><Loader size={32} className="text-primary animate-spin mx-auto" /></td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-12 text-gray-500">No cameras found.</td></tr>
                                ) : (
                                    currentItems.map((camera) => (
                                        <tr key={camera._id} className="border-b border-gray-300 hover:bg-gray-100 transition-colors">
                                            <td className="py-3 px-6 h-12">
                                                <div className="font-medium text-gray-900">{camera.name}</div>
                                            </td>
                                            <td className="py-3 px-6 text-center h-12 font-mono">
                                                {camera.serialNumber}
                                            </td>
                                            <td className="py-3 px-6 text-center h-12">
                                                {/* Optional: Add basic color styling based on status */}
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${camera.status?.toLowerCase() === 'online' ? 'bg-green-100 text-green-700' :
                                                    camera.status?.toLowerCase() === 'offline' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {camera.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <button
                                                    onClick={() => toCameraDetailsPage(camera.serialNumber)}
                                                    className="text-gray-500 hover:text-[#000060] transition-colors p-1 rounded-full hover:bg-blue-50"
                                                >
                                                    <View size={24} className="mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Footer --- */}
                    {!loading && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 px-2 gap-4">
                            <span>
                                Showing {filteredCameras.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredCameras.length)} of {filteredCameras.length}
                            </span>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span>Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-gray-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer bg-white"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="font-medium">{currentPage} / {totalPages || 1}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CamerasPage;