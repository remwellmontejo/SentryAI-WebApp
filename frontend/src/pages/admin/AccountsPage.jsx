import React, { useState, useEffect } from 'react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import TableFilterBar from '../../components/TableFilterBar.jsx';
import { ChevronLeft, ChevronRight, Loader, Trash2 } from "lucide-react";

const AccountsPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [sortOrder, setSortOrder] = useState("newest");

    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsers(response.data.users || []);
        } catch (error) {
            toast.error("Failed to fetch users");
            console.error(error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
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

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            const response = await api.delete(`api/users/${deleteTarget._id}`);
            toast.success(response.data.message);
            setDeleteTarget(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account");
        }
    };

    // --- LOGIC: SEARCH & FILTER ---
    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();

        const usernameMatch = user.username?.toLowerCase().includes(query);
        const emailMatch = user.email?.toLowerCase().includes(query);
        const roleMatch = user.role?.toLowerCase().includes(query);

        const displayedDate = new Date(user.createdAt).toLocaleDateString();
        const dateStringMatch = displayedDate.includes(query);

        const isTextMatch = usernameMatch || emailMatch || roleMatch || dateStringMatch;

        let isDateInRange = true;
        if (dateRange.start || dateRange.end) {
            const userDate = new Date(user.createdAt).setHours(0, 0, 0, 0);
            if (dateRange.start) { if (userDate < new Date(dateRange.start).setHours(0, 0, 0, 0)) isDateInRange = false; }
            if (dateRange.end) { if (userDate > new Date(dateRange.end).setHours(23, 59, 59, 999)) isDateInRange = false; }
        }

        return isTextMatch && isDateInRange;
    }).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
                        <h2 className="text-2xl font-bold text-base-content flex-shrink-0">Accounts</h2>

                        <TableFilterBar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            placeholder="Search Users..."
                            dateRange={dateRange}
                            onDateChange={handleDateChange}
                            onClearDate={clearDateFilter}
                            sortOrder={sortOrder}
                            onSortChange={(order) => { setSortOrder(order); setCurrentPage(1); }}
                        />
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
                                    <th className="py-3 px-6 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 bg-white">
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-12"><Loader size={32} className="text-primary animate-spin mx-auto" /></td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-base-content/50">
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
                                            <td className="py-3 px-6 h-12 text-center">
                                                <button
                                                    onClick={() => setDeleteTarget(user)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                    title="Delete Account"
                                                >
                                                    <Trash2 size={18} />
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
                                Showing {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <Trash2 size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete the account <strong>{deleteTarget.username}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsPage;
