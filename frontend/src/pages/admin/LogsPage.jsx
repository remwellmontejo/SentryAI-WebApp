import React, { useState, useEffect } from 'react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import TableFilterBar from '../../components/TableFilterBar.jsx';
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [sortOrder, setSortOrder] = useState("newest");

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

    // --- LOGIC: SEARCH & FILTER ---
    const filteredLogs = logs.filter((log) => {
        const query = searchQuery.toLowerCase();

        const usernameMatch = log.username?.toLowerCase().includes(query);
        const actionMatch = log.action?.toLowerCase().includes(query);
        const detailsMatch = log.details?.toLowerCase().includes(query);

        const displayedDate = new Date(log.createdAt).toLocaleDateString();
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = usernameMatch || actionMatch || detailsMatch || dateStringMatch;

        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const logDate = new Date(log.createdAt).setHours(0, 0, 0, 0);
            if (dateRange.start) { if (logDate < new Date(dateRange.start).setHours(0, 0, 0, 0)) isDateInRange = false; }
            if (dateRange.end) { if (logDate > new Date(dateRange.end).setHours(23, 59, 59, 999)) isDateInRange = false; }
        }

        return isTextMatch && isDateInRange;
    }).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleDateChange = (e) => { setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value })); setCurrentPage(1); };
    const clearDateFilter = () => { setDateRange({ start: "", end: "" }); };

    return (
        <div className="min-h-screen" data-theme="corporateBlue">
            <div className='mb-5'>
                <Navbar />
            </div>
            <div className='mx-4 sm:mx-20'>

                <div className="w-full bg-white p-4 rounded-lg mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-base-content flex-shrink-0">Activity Logs</h2>

                        <TableFilterBar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            placeholder="Search logs..."
                            dateRange={dateRange}
                            onDateChange={handleDateChange}
                            onClearDate={clearDateFilter}
                            sortOrder={sortOrder}
                            onSortChange={(order) => { setSortOrder(order); setCurrentPage(1); }}
                        />
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
                                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer bg-white">
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
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
    );
};

export default LogsPage;
