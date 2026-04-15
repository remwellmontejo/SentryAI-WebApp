import Navbar from '../../components/Navbar.jsx'
import InfoCard from '../../components/InfoCard.jsx'
import TableFilterBar from '../../components/TableFilterBar.jsx'
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, View, CarFront, ClipboardClock, CalendarCheck2, Video, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../lib/axios.js";

const HomePage = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApprehended: 0,
    pendingReview: 0,
    apprehendedToday: 0,
    activeCameras: 0
  });

  // Pagination & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter State
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortOrder, setSortOrder] = useState("newest");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, vehicles] = await Promise.all([
          api.get('/api/apprehended-vehicle/stats/dashboard'),
          api.get('/api/apprehended-vehicle/status/Pending')
        ]);
        setStats(stats.data);
        setVehicles(vehicles.data);
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

  // --- LOGIC: SEARCH & FILTER ---
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

    // Vehicle Type Filter
    if (vehicleTypeFilter !== 'All' && vehicle.vehicleType !== vehicleTypeFilter) return false;

    // Date Range Filter
    let isDateInRange = true;
    if (dateRange.start || dateRange.end) {
      const vehicleDate = new Date(vehicle.createdAt).setHours(0, 0, 0, 0);
      if (dateRange.start) {
        const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
        if (vehicleDate < startDate) isDateInRange = false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
        if (vehicleDate > endDate) isDateInRange = false;
      }
    }

    return isTextMatch && isDateInRange;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
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
      <div className='mt-6 px-4 sm:mx-20'>

        <div className='grid grid-cols-2 gap-3 sm:gap-6 mb-4 lg:grid-cols-4'>
          <InfoCard title="Total Apprehended" content={stats.totalApprehended.toString()} properties="bg-white text-green-800" properties_for_value="text-[#000060]">
            <CarFront className='size-10 sm:size-20' />
          </InfoCard>
          <InfoCard title="Apprehended Today" content={stats.apprehendedToday.toString()} properties="bg-white text-red-800" properties_for_value="text-[#000060]">
            <CalendarCheck2 className='size-10 sm:size-20' />
          </InfoCard>
          <InfoCard title="Pending Review" content={stats.pendingReview.toString()} properties="bg-white text-yellow-600" properties_for_value="text-[#000060]">
            <ClipboardClock className='size-10 sm:size-20' />
          </InfoCard>
          <InfoCard title="Active Cameras" content={stats.activeCameras.toString()} properties="bg-white text-blue-800" properties_for_value="text-[#000060]">
            <Video className='size-10 sm:size-20' />
          </InfoCard>
        </div>

        <div className="w-full bg-white p-4 rounded-lg">

          {/* --- Top Header Section --- */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-base-content flex-shrink-0">Pending Apprehensions</h2>

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

          {/* --- The Table --- */}
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
                  <tr><td colSpan="6" className="text-center py-12 text-gray-500">No pending apprehensions.</td></tr>
                ) : (
                  currentItems.map((vehicle) => (
                    <tr key={vehicle._id} className="border-b border-gray-300 hover:bg-gray-100 transition-colors">
                      <td className="py-3 px-6 h-12 font-medium text-gray-900">{vehicle.vehicleType}</td>
                      <td className="py-3 px-6 text-center h-12 font-mono uppercase">{vehicle.plateNumber || "N/A"}</td>
                      <td className="py-3 px-6 text-center h-12 text-sm text-gray-600">{vehicle.camera?.serialNumber || vehicle.cameraSerialNumber || "N/A"}</td>
                      <td className="py-3 px-6 text-center h-12">{formatDate(vehicle.createdAt)}</td>
                      <td className="py-3 px-6 text-center h-12">{formatTime(vehicle.createdAt)}</td>
                      <td className="py-3 px-6 h-12 text-center">
                        <button
                          onClick={() => toDetailsPage(vehicle._id)}
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

export default HomePage