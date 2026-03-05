import Navbar from '../../../components/Navbar.jsx'
import { useState, useEffect, useRef } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, View, ArrowLeft, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../../lib/axios.js";

const RejectsPage = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Date Filter State
    const [showFilter, setShowFilter] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const filterRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch ONLY Rejected apprehensions
                const response = await api.get('/api/apprehended-vehicle/status/Rejected');
                setVehicles(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();

        // Click outside listener for filter dropdown
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toDetailsPage = (id) => {
        navigate(`/apprehension/${id}`);
    };

    // --- LOGIC: SEARCH & FILTER ---
    const filteredVehicles = vehicles.filter((vehicle) => {
        const query = searchQuery.toLowerCase();

        // 1. Text Search (Type, Status, Plate, Date String)
        const typeMatch = vehicle.vehicleType?.toLowerCase().includes(query);
        const statusMatch = vehicle.status?.toLowerCase().includes(query);
        const plateMatch = vehicle.plateNumber?.toLowerCase().includes(query);

        // Format date for string search (matches table display)
        const displayedDate = new Date(vehicle.createdAt).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: '2-digit'
        }).replace(/\//g, '-');
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = typeMatch || statusMatch || plateMatch || dateStringMatch;

        // 2. Date Range Filter
        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const vehicleDate = new Date(vehicle.createdAt).setHours(0, 0, 0, 0); // Normalize to midnight

            if (dateRange.start) {
                const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
                if (vehicleDate < startDate) isDateInRange = false;
            }

            if (dateRange.end) {
                const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999); // End of day
                if (vehicleDate > endDate) isDateInRange = false;
            }
        }

        return isTextMatch && isDateInRange;
    });

    // --- LOGIC: PAGINATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    // --- HANDLERS ---
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearDateFilter = () => {
        setDateRange({ start: "", end: "" });
        setShowFilter(false);
    };

    // --- FORMATTERS ---
    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: '2-digit'
        }).replace(/\//g, '-');
    };

    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true
        });
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

                        {/* Title & Back Button Container */}
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-base-content text-red-700">Rejected Apprehensions</h2>

                            {/* Expanding Back Button to Approved Apprehensions */}
                            <button
                                onClick={() => navigate('/apprehensions')} // Adjust route to your Approved page
                                className="group flex items-center gap-0 hover:gap-2 p-2 border border-gray-400 rounded-md text-black hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 overflow-hidden"
                                title="Back to Approved Apprehensions"
                            >
                                <ArrowLeft size={20} className="min-w-[20px]" />
                                <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-300 ease-in-out font-semibold text-sm">
                                    Back to Approved
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto relative">

                            {/* Filter Button & Dropdown */}
                            <div ref={filterRef} className="relative">
                                <button
                                    onClick={() => setShowFilter(!showFilter)}
                                    className={`p-2 border rounded-md transition-colors flex items-center gap-2 ${(dateRange.start || dateRange.end)
                                        ? "bg-blue-50 border-blue-500 text-blue-600"
                                        : "border-gray-400 hover:bg-gray-50 text-black"
                                        }`}
                                >
                                    <Filter size={20} />
                                    {(dateRange.start || dateRange.end) && <span className="text-xs font-bold">Active</span>}
                                </button>

                                {/* Filter Dropdown */}
                                {showFilter && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-gray-700">Filter by Date</h3>
                                            {(dateRange.start || dateRange.end) && (
                                                <button onClick={clearDateFilter} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    name="start"
                                                    value={dateRange.start}
                                                    onChange={handleDateChange}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    name="end"
                                                    value={dateRange.end}
                                                    onChange={handleDateChange}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search Plate, Type..."
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
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Vehicle Type</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Plate Number</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Date</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Time</th>
                                    <th className="py-3 px-6 font-semibold text-center">Details</th>
                                </tr>
                            </thead>

                            <tbody className="text-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-12"><Loader size={32} className="text-primary animate-spin mx-auto" /></td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-12 text-gray-500">No records found.</td></tr>
                                ) : (
                                    currentItems.map((vehicle) => (
                                        <tr key={vehicle._id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-6 h-12 font-medium text-gray-900">{vehicle.vehicleType}</td>
                                            <td className="py-3 px-6 text-center h-12 font-mono uppercase">{vehicle.plateNumber || "N/A"}</td>
                                            <td className="py-3 px-6 text-center h-12">{formatDate(vehicle.createdAt)}</td>
                                            <td className="py-3 px-6 text-center h-12">{formatTime(vehicle.createdAt)}</td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <button
                                                    onClick={() => toDetailsPage(vehicle._id)}
                                                    className="text-gray-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
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
                                Showing {filteredVehicles.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredVehicles.length)} of {filteredVehicles.length}
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
    )
}

export default RejectsPage;