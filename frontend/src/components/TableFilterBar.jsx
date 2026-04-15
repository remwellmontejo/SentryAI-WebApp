import { useState, useRef, useEffect } from 'react';
import { Search, Filter, ArrowDown, ArrowUp, Car, Bike, X, ChevronDown } from 'lucide-react';

const TableFilterBar = ({
    searchQuery,
    onSearchChange,
    placeholder = "Search...",
    dateRange,
    onDateChange,
    onClearDate,
    sortOrder = "newest",
    onSortChange,
    showVehicleFilter = false,
    vehicleTypeFilter = "All",
    onVehicleTypeChange,
}) => {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dateRef = useRef(null);
    const mobileRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (dateRef.current && !dateRef.current.contains(e.target)) setShowDatePicker(false);
            if (mobileRef.current && !mobileRef.current.contains(e.target)) setShowMobileFilters(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const hasActiveFilters = dateRange.start || dateRange.end || vehicleTypeFilter !== 'All' || sortOrder !== 'newest';
    const activeCount = [
        dateRange.start || dateRange.end ? 1 : 0,
        vehicleTypeFilter !== 'All' ? 1 : 0,
        sortOrder !== 'newest' ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const handleClearAll = () => {
        onClearDate();
        if (onVehicleTypeChange) onVehicleTypeChange('All');
        onSortChange('newest');
        setShowMobileFilters(false);
    };

    const VehicleFilterPills = () => (
        <div className="flex items-center gap-1">
            {['All', 'Car', 'Motorcycle'].map((type) => (
                <button
                    key={type}
                    onClick={() => { onVehicleTypeChange(type); setShowMobileFilters(false); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 ${vehicleTypeFilter === type
                        ? 'bg-[#000060] text-white border-[#000060]'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    {type === 'Car' && <Car size={13} />}
                    {type === 'Motorcycle' && <Bike size={13} />}
                    {type}
                </button>
            ))}
        </div>
    );

    const SortToggle = () => (
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
                onClick={() => { onSortChange('newest'); setShowMobileFilters(false); }}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all ${sortOrder === 'newest'
                    ? 'bg-[#000060] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
            >
                <ArrowDown size={13} /> Newest
            </button>
            <button
                onClick={() => { onSortChange('oldest'); setShowMobileFilters(false); }}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all border-l border-gray-300 ${sortOrder === 'oldest'
                    ? 'bg-[#000060] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
            >
                <ArrowUp size={13} /> Oldest
            </button>
        </div>
    );

    const DateRangePicker = () => (
        <div className="space-y-2">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input type="date" name="start" value={dateRange.start} onChange={onDateChange}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input type="date" name="end" value={dateRange.end} onChange={onDateChange}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
        </div>
    );

    return (
        <>
            {/* ====== DESKTOP: Filters then search ====== */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
                {showVehicleFilter && <VehicleFilterPills />}
                <SortToggle />

                {/* Date Range Button + Dropdown */}
                <div ref={dateRef} className="relative">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 ${(dateRange.start || dateRange.end)
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={13} />
                        Date Range
                        {(dateRange.start || dateRange.end) && (
                            <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none">✓</span>
                        )}
                    </button>

                    {showDatePicker && (
                        <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-700 text-sm">Filter by Date</h3>
                                {(dateRange.start || dateRange.end) && (
                                    <button onClick={() => { onClearDate(); setShowDatePicker(false); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                                )}
                            </div>
                            <DateRangePicker />
                        </div>
                    )}
                </div>

                {/* Search — last */}
                <div className="relative w-56 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder={placeholder} value={searchQuery} onChange={onSearchChange}
                        className="pl-10 pr-4 py-[5px] border border-gray-300 rounded-full w-full focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                </div>
            </div>

            {/* ====== MOBILE / TABLET: Dropdown with all controls ====== */}
            <div ref={mobileRef} className="md:hidden w-full relative">
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`w-full p-2.5 border rounded-lg transition-colors flex items-center justify-between font-medium text-sm ${hasActiveFilters
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <Filter size={16} />
                        Search & Filters
                        {activeCount > 0 && (
                            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">{activeCount}</span>
                        )}
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                </button>

                {showMobileFilters && (
                    <>
                        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowMobileFilters(false)} />
                        <div className="fixed left-4 right-4 top-1/4 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-lg">Search & Filters</h3>
                                {hasActiveFilters && (
                                    <button onClick={handleClearAll} className="text-xs text-red-500 font-bold">Clear All</button>
                                )}
                            </div>

                            {/* Search */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" placeholder={placeholder} value={searchQuery} onChange={onSearchChange}
                                        className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                            </div>

                            {showVehicleFilter && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vehicle Type</p>
                                    <VehicleFilterPills />
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort by Date</p>
                                <SortToggle />
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date Range</p>
                                <DateRangePicker />
                                {(dateRange.start || dateRange.end) && (
                                    <button onClick={onClearDate} className="text-xs text-red-500 font-medium mt-2">Clear Dates</button>
                                )}
                            </div>

                            <button onClick={() => setShowMobileFilters(false)}
                                className="w-full py-2.5 bg-[#000060] text-white rounded-lg font-bold text-sm">
                                Apply
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default TableFilterBar;
