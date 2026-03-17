import React, { useState, useEffect, useRef } from 'react';
import SentryAILogo from '../assets/sentry-ai-logo.svg';
import { Link, useNavigate } from 'react-router'
import { List, LogOut, Bell, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast';
import api from '../lib/axios';

const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    
    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/notifications');
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        // Fetch initially
        fetchNotifications();

        // Refresh periodically (every 15s)
        const intervalId = setInterval(fetchNotifications, 15000);

        // Click outside listener
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("Marked all as read");
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification._id, { stopPropagation: () => {} });
        }
        setShowDropdown(false);
        if (notification.referenceId) {
            navigate(`/apprehension/${notification.referenceId}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
        toast.success('Log out successfully!')
    };

    return (
        <header className="navbar bg-base-100 shadow-md relative z-50" data-theme="corporateBlue">
            <div className="navbar-start">
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost lg:hidden">
                        <List size={25} className=''></List>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link to={"/home"} className='font-semibold'>Home</Link></li>
                        <li><Link to={"/apprehensions"} className='font-semibold'>Apprehensions</Link></li>
                        <li><Link to={"/cameras"} className='font-semibold'>Cameras</Link></li>
                        {role === 'Admin' && (
                            <>
                                <li><Link to={"/admin/accounts"} className='font-semibold'>Accounts</Link></li>
                                <li><Link to={"/admin/logs"} className='font-semibold'>System Logs</Link></li>
                            </>
                        )}
                        <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                    </ul>
                </div>
                <Link to={"/home"} className="mx-2 text-2xl normal-case font-bold flex items-center space-x-2">
                    <img src={SentryAILogo} className="w-10 h-10 mx-auto" />
                    <a href="" className='ml-2'>SentryAI</a>
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to={"/home"} className='font-semibold'>Home</Link></li>
                    <li><Link to={"/apprehensions"} className='font-semibold'>Apprehensions</Link></li>
                    <li><Link to={"/cameras"} className='font-semibold'>Cameras</Link></li>
                    {role === 'Admin' && (
                        <>
                            <li><Link to={"/admin/accounts"} className='font-semibold'>Accounts</Link></li>
                            <li><Link to={"/admin/logs"} className='font-semibold'>Logs</Link></li>
                        </>
                    )}
                    <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                </ul>
            </div>

            <div className="navbar-end flex items-center gap-2 sm:gap-4">
                
                {/* NOTIFICATIONS DROPDOWN */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        className="btn btn-ghost btn-circle relative text-base-content hover:bg-base-200"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <Bell size={22} className={unreadCount > 0 ? "animate-pulse stroke-orange-400 fill-orange-400" : ""} />
                        {unreadCount > 0 && (
                            <div className="absolute top-[2px] right=[2px] w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                        )}
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                            <div className="bg-gray-50 p-3 border-b flex justify-between items-center text-gray-800">
                                <h3 className="font-bold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-80 overflow-y-auto w-full">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 m-0 p-0 text-left">
                                        {notifications.map((notif) => (
                                            <li 
                                                key={notif._id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                                                        <p className={`text-sm tracking-tight text-left block ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-xs text-gray-400 mt-1 block">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <button 
                                                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                                                            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-white flex-shrink-0 self-center"
                                                            title="Mark as read"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-primary btn-outline flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-bold"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                </button>
            </div>
        </header>
    )
}

export default Navbar
