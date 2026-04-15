import Navbar from '../../../components/Navbar.jsx'
import TableFilterBar from '../../../components/TableFilterBar.jsx'
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, View, ArrowLeft, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../../lib/axios.js";

const RejectsPage = () => {
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [sortOrder, setSortOrder] = useState("newest");
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/api/apprehended-vehicle/status/Rejected');
                setVehicles(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toDetailsPage = (id) => {
        const vehicleIds = filteredVehicles.map(v => v._id);
        navigate(`/apprehension/${id}`, { state: { vehicleIds } });
    };

    const filteredVehicles = vehicles.filter((vehicle) => {
        const query = searchQuery.toLowerCase();

        const typeMatch = vehicle.vehicleType?.toLowerCase().includes(query);
        const statusMatch = vehicle.status?.toLowerCase().includes(query);
        const plateMatch = vehicle.plateNumber?.toLowerCase().includes(query);

        const displayedDate = new Date(vehicle.createdAt).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: '2-digit'
        }).replace(/\//g, '-');
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = typeMatch || statusMatch || plateMatch || dateStringMatch;

        if (vehicleTypeFilter !== 'All' && vehicle.vehicleType !== vehicleTypeFilter) return false;

        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const vehicleDate = new Date(vehicle.createdAt).setHours(0, 0, 0, 0);
            if (dateRange.start) { if (vehicleDate < new Date(dateRange.start).setHours(0, 0, 0, 0)) isDateInRange = false; }
            if (dateRange.end) { if (vehicleDate > new Date(dateRange.end).setHours(23, 59, 59, 999)) isDateInRange = false; }
        }

        return isTextMatch && isDateInRange;
    }).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleDateChange = (e) => { setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value })); setCurrentPage(1); };
    const clearDateFilter = () => { setDateRange({ start: "", end: "" }); };

    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
    };
    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className='min-h-screen' data-theme="corporateBlue">
            <div className='mb-5'>
                <Navbar />
            </div>
            <div className='mx-4 sm:mx-20'>

                <div className="w-full bg-white p-4 rounded-lg mt-6">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-base-content text-red-700">Rejected Apprehensions</h2>
                            <button
                                onClick={() => navigate('/apprehensions')}
                                className="flex items-center p-2 border border-blue-300 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-300"
                                title="Back to Approved Apprehensions"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        <TableFilterBar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            placeholder="Search Plate, Type..."
                            dateRange={dateRange}
                            onDateChange={handleDateChange}
                            onClearDate={clearDateFilter}
                            sortOrder={sortOrder}
                            onSortChange={(order) => { setSortOrder(order); setCurrentPage(1); }}
                            showVehicleFilter
                            vehicleTypeFilter={vehicleTypeFilter}
                            onVehicleTypeChange={(type) => { setVehicleTypeFilter(type); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="border border-gray-300 rounded-t-lg overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-[#000060] text-white">
                                <tr>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Vehicle Type</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Plate Number</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Camera</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Date</th>
                                    <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Time</th>
                                    <th className="py-3 px-6 font-semibold text-center">Details</th>
                                </tr>
                            </thead>

                            <tbody className="text-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-12"><Loader size={32} className="text-primary animate-spin mx-auto" /></td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-12 text-gray-500">No records found.</td></tr>
                                ) : (
                                    currentItems.map((vehicle) => (
                                        <tr key={vehicle._id} className="border-b border-gray-300 hover:bg-gray-100 transition-colors">
                                            <td className="py-3 px-6 h-12 font-medium text-gray-900">{vehicle.vehicleType}</td>
                                            <td className="py-3 px-6 text-center h-12 font-mono uppercase">{vehicle.plateNumber || "N/A"}</td>
                                            <td className="py-3 px-6 text-center h-12 text-sm text-gray-600">{vehicle.camera?.serialNumber || vehicle.cameraSerialNumber || "N/A"}</td>
                                            <td className="py-3 px-6 text-center h-12">{formatDate(vehicle.createdAt)}</td>
                                            <td className="py-3 px-6 text-center h-12">{formatTime(vehicle.createdAt)}</td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <button onClick={() => toDetailsPage(vehicle._id)} className="text-gray-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100">
                                                    <View size={24} className="mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 px-2 gap-4">
                            <span>
                                Showing {filteredVehicles.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredVehicles.length)} of {filteredVehicles.length}
                            </span>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span>Rows:</span>
                                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer bg-white">
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={18} /></button>
                                    <span className="font-medium">{currentPage} / {totalPages || 1}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={18} /></button>
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