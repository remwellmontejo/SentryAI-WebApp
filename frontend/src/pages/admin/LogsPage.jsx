import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import { Loader, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination States
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [showFilter, setShowFilter] = useState(false);

    const filterRef = useRef(null);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/api/logs');
            setLogs(response.data.logs || []);
        } catch (error) {
            toast.error("Failed to fetch system logs.");
            console.error(error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // --- CLICK OUTSIDE HANDLER FOR FILTER ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };

        if (showFilter) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilter]);

    // --- LOGIC: SEARCH & FILTER ---
    const filteredLogs = logs.filter((log) => {
        const query = searchQuery.toLowerCase();

        // 1. Text Search
        const usernameMatch = log.username?.toLowerCase().includes(query);
        const actionMatch = log.action?.toLowerCase().includes(query);
        const detailsMatch = log.details?.toLowerCase().includes(query);

        const displayedDate = new Date(log.createdAt).toLocaleDateString();
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = usernameMatch || actionMatch || detailsMatch || dateStringMatch;

        // 2. Date Range Filter
        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const logDate = new Date(log.createdAt).setHours(0, 0, 0, 0); // Normalize to midnight

            if (dateRange.start) {
                const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
                if (logDate < startDate) isDateInRange = false;
            }

            if (dateRange.end) {
                const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999); // End of day
                if (logDate > endDate) isDateInRange = false;
            }
        }

        return isTextMatch && isDateInRange;
    });

    // --- LOGIC: PAGINATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

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

    return (
        <div className="min-h-screen" data-theme="corporateBlue">
            <div className='mb-5'>
                <Navbar />
            </div>
            <div className='mx-4 sm:mx-20'>

                <div className="w-full bg-white p-4 rounded-lg mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            <h2 className="text-2xl font-bold text-base-content hidden sm:block mr-4 flex-shrink-0">Activity Logs</h2>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto relative">
                            {/* Filter Button & Dropdown */}
                            <div ref={filterRef} className="relative">
                                <button
                                    onClick={() => setShowFilter(!showFilter)}
                                    className={`p-2 border rounded-md transition-colors flex items-center gap-2 font-medium text-sm ${(dateRange.start || dateRange.end)
                                        ? "bg-blue-50 border-blue-500 text-blue-600"
                                        : "border-gray-400 hover:bg-gray-50 text-black"
                                        }`}
                                >
                                    <Filter size={18} />
                                    <span>Filter</span>
                                    {(dateRange.start || dateRange.end) && <span className="text-xs font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 leading-none">✓</span>}
                                </button>

                                {/* Filter Dropdown */}
                                {showFilter && (
                                    <>
                                        {/* Mobile backdrop */}
                                        <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setShowFilter(false)} />
                                        <div className="fixed left-4 right-4 top-1/3 z-50 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 w-auto sm:w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
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
                                    </>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-2 border border-gray-400 rounded-full w-full focus:outline-none focus:border-blue-900 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded-t-lg overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="bg-[#000060] text-white">
                                <tr>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30 whitespace-nowrap">Timestamp</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30 whitespace-nowrap">Username</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30 whitespace-nowrap">Action Group</th>
                                    <th className="py-3 px-6 font-semibold w-full">Detailed Description</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12">
                                            <div className="flex justify-center items-center h-24">
                                                <Loader size={32} className="text-blue-600 animate-spin" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-base-content/50">
                                            {searchQuery || dateRange.start || dateRange.end
                                                ? "No logs match your search/filter criteria."
                                                : "No logs found in the system."}
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((log) => (
                                        <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-6 text-sm text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
                                            </td>
                                            <td className="py-3 px-6 font-medium text-gray-900 whitespace-nowrap">
                                                {log.username}
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-gray-200">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-gray-600 block">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Footer --- */}
                    {!loading && filteredLogs.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 px-2 gap-4">
                            <span>
                                Showing {filteredLogs.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length}
                            </span>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span>Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1); // Reset to first page when changing page size
                                        }}
                                        className="border border-gray-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer bg-white"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
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

export default LogsPage;
