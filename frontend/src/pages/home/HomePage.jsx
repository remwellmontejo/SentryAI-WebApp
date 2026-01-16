
import Navbar from '../../components/Navbar.jsx'
import InfoCard from '../../components/InfoCard.jsx'
import { useState, useEffect } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, View } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../lib/axios.js";
import { CarFront, ClipboardClock, CalendarCheck2, Video } from 'lucide-react'

const HomePage = () => {
  // State for storing real data from the database
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data from your Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // using port 5001 as per your last update
        const response = await api.get('/api/apprehended-vehicle/get');
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
    navigate(`/apprehension/${id}`);
  };

  // Helper: Format Date in Manila Time
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '-');
  };

  // Helper: Format Time in Manila Time
  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className='min-h-screen' data-theme="corporateBlue">
      <div className='mb-5'>
        <Navbar />
      </div>
      <div className='mx-20'>
        <div className='grid grid-cols-1 gap-6 mb-4 sm:grid-cols-2 lg:grid-cols-4'>
          <InfoCard title="Total Apprehended Cars" content="0" properties="bg-green-400 m-2" properties_for_value="text-base-content">
            <CarFront className='size-20 ' />
          </InfoCard>
          <InfoCard title="Apprehended Today" content="0" properties="bg-red-400 m-2" properties_for_value="text-base-content">
            <CalendarCheck2 className='size-20 ' />
          </InfoCard>
          <InfoCard title="Pending Apprehensions" content="2" properties="bg-yellow-400 m-2" properties_for_value="text-base-content">
            <ClipboardClock className='size-20 ' />
          </InfoCard>
          <InfoCard title="Active Cameras" content="1" properties="bg-blue-400 m-2" properties_for_value="text-base-content">
            <Video className='size-20 ' />
          </InfoCard>
        </div>
        <div className="w-full bg-white p-4 rounded-lg mt-6">

          {/* --- Top Header Section --- */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-base-content">Pending Apprehensions</h2>

            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <button className="p-2 border border-gray-400 rounded-md hover:bg-gray-50 transition-colors">
                <Filter size={20} className="text-black" />
              </button>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-10 pr-4 py-2 border border-gray-400 rounded-full w-64 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          {/* --- The Table --- */}
          <div className="border border-gray-300 rounded-t-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              {/* Table Head - Using your specific #000060 Blue */}
              <thead className="bg-[#000060] text-white">
                <tr>
                  <th className="py-3 px-6 font-semibold border-r border-blue-800/30">Vehicle Type</th>
                  <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Date</th>
                  <th className="py-3 px-6 font-semibold text-center border-r border-blue-800/30">Time</th>
                  <th className="py-3 px-6 font-semibold text-center">Details</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="text-gray-700">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-8">Loading data...</td></tr>
                ) : vehicles.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8">No pending apprehensions found.</td></tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="border-b border-gray-300 hover:bg-gray-50">
                      {/* Column 1: Vehicle Type */}
                      <td className="py-3 px-6 h-12">
                        <div className="font-medium text-gray-900">{vehicle.vehicleType}</div>
                      </td>

                      {/* Column 2: Date */}
                      <td className="py-3 px-6 text-center h-12">
                        {formatDate(vehicle.createdAt)}
                      </td>

                      {/* Column 3: Time */}
                      <td className="py-3 px-6 text-center h-12">
                        {formatTime(vehicle.createdAt)}
                      </td>

                      {/* Column 4: Action (View Icon) */}
                      <td className="py-3 px-6 h-12 text-center">
                        <button
                          onClick={() => toDetailsPage(vehicle._id)}
                          className="text-gray-500 hover:text-[#000060] transition-colors p-1 rounded-full hover:bg-blue-50"
                        >
                          <View size={30} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer --- */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600 px-2">
            {/* Left side text */}
            <span>1 - {vehicles.length} of {vehicles.length}</span>

            {/* Right side controls */}
            <div className="flex items-center gap-6">

              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <div className="flex items-center font-semibold cursor-pointer">
                  {vehicles.length} <ChevronDown size={16} className="ml-1" />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">
                  <ChevronLeft size={18} />
                </button>
                <span>1-1</span>
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
