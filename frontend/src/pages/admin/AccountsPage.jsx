import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import { Search, Filter, ChevronLeft, ChevronRight, Loader } from "lucide-react";

const AccountsPage = () => {
    // --- STATE ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Date Filter State
    const [showFilter, setShowFilter] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const filterRef = useRef(null);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsers(response.data.users || []); // ADD FALLBACK HERE
        } catch (error) {
            toast.error("Failed to fetch users");
            console.error(error);
            setUsers([]); // SET EMPTY ARRAY ON ERROR
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // Click outside listener for filter dropdown
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await api.put(`api/users/${userId}/role`, { role: newRole });
            toast.success(response.data.message);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const response = await api.put(`api/users/${userId}/status`, { status: newStatus });
            toast.success(response.data.message);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    // --- LOGIC: SEARCH & FILTER ---
    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();

        // 1. Text Search
        const usernameMatch = user.username?.toLowerCase().includes(query);
        const emailMatch = user.email?.toLowerCase().includes(query);
        const roleMatch = user.role?.toLowerCase().includes(query);

        // Format date for string search
        const displayedDate = new Date(user.createdAt).toLocaleDateString();
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = usernameMatch || emailMatch || roleMatch || dateStringMatch;

        // 2. Date Range Filter
        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const userDate = new Date(user.createdAt).setHours(0, 0, 0, 0); // Normalize to midnight

            if (dateRange.start) {
                const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
                if (userDate < startDate) isDateInRange = false;
            }

            if (dateRange.end) {
                const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999); // End of day
                if (userDate > endDate) isDateInRange = false;
            }
        }

        return isTextMatch && isDateInRange;
    });

    // --- LOGIC: PAGINATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-base-content">Accounts</h2>
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
                                    placeholder="Search Users..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-2 border border-gray-400 rounded-full w-full focus:outline-none focus:border-blue-900 transition-colors"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="border border-gray-300 rounded-t-lg overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-[#000060] text-white">
                                <tr>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Name</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Username</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Email</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30 text-center">Role</th>
                                    <th className="py-3 px-6 font-semibold border-r border-blue-800/30 text-center">Status</th>
                                    <th className="py-3 px-6 font-semibold text-center">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 bg-white">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-12"><Loader size={32} className="text-primary animate-spin mx-auto" /></td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-base-content/50">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((user) => (
                                        <tr key={user._id} className="border-b border-gray-300 hover:bg-gray-100 transition-colors">
                                            <td className="py-3 px-6 h-12 font-medium text-gray-900">
                                                {(user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : <span className="text-gray-400 italic">—</span>}
                                            </td>
                                            <td className="py-3 px-6 h-12 font-medium text-gray-900">{user.username}</td>
                                            <td className="py-3 px-6 h-12">{user.email}</td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <select
                                                    className="select select-bordered select-sm w-full max-w-[120px] bg-white text-gray-700"
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="Employee">Employee</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-6 h-12 text-center">
                                                <select
                                                    className={`select select-bordered select-sm w-full max-w-[120px] bg-white font-semibold ${user.status === 'active' ? 'text-green-600 border-green-300' : 'text-red-500 border-red-300'}`}
                                                    value={user.status}
                                                    onChange={(e) => handleStatusChange(user._id, e.target.value)}
                                                >
                                                    <option value="active" className="text-green-600">Active</option>
                                                    <option value="inactive" className="text-red-500">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-6 h-12 text-center text-sm text-gray-600">
                                                {new Date(user.createdAt).toLocaleDateString()}
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
                                Showing {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
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

export default AccountsPage;
