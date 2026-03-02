import React, { useState } from 'react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router'; // Changed to react-router-dom
import toast from 'react-hot-toast';
import api from '../../lib/axios'; // Use your custom Axios instance!

function LandingPage() {
    const [plateNumber, setPlateNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        // 1. Basic validation
        if (!plateNumber.trim()) {
            toast.error("Please enter a plate number.");
            return;
        }

        // 2. Sanitize for URL (Remove special characters)
        const cleanPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        setLoading(true);

        try {
            // 3. Call the public API
            const response = await api.get(`/public/search/${cleanPlate}`);

            if (response.data.data && response.data.data.length > 0) {
                toast.error("Record found. You have an apprehension.");
                // Route to a public details page to show them their violation
                navigate(`/public-results/${cleanPlate}`);
            }
        } catch (error) {
            // 4. Handle 404 (No records found - which is Good News for the driver!)
            if (error.response && error.response.status === 404) {
                toast.success("Good news! No apprehensions found for this plate.", {
                    icon: '🎉',
                    duration: 5000
                });
                setPlateNumber(''); // Clear the input
            } else {
                toast.error("An error occurred while searching. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row" data-theme="corporateBlue">
            {/* 1. Left Pane (Logo & Brand) */}
            <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center bg-base-100 text-neutral-content p-10 relative shadow-2xl">
                <div className="text-center">
                    <div className="mb-4">
                        <SentryAILogo className="w-100 h-100 mx-auto" />
                    </div>
                    <h2 className="w-full text-center text-7xl font-bold text-black mb-4">
                        SentryAI
                    </h2>
                    <p className="text-lg text-primary">
                        No Contact Apprehension Policy for Illegal Parking
                    </p>
                </div>
            </div>

            {/* 2. Right Pane (Search Form) */}
            <div className="flex flex-1 flex-col justify-center items-center bg-primary p-6 md:p-10">
                <h2 className="justify-center text-3xl font-bold text-base-100 mb-4 text-center">
                    Have you been apprehended?
                </h2>
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <fieldset className="fieldset bg-white border-base-300 rounded-xl border p-8 px-10 space-y-4">
                        <div className='w-full'>
                            <h2 className="w-full text-center text-2xl font-bold text-black mb-2">
                                Plate Number
                            </h2>
                        </div>
                        <div>
                            <input
                                type="text" // Changed from "input" to "text"
                                className="input input-bordered w-full rounded-md placeholder-gray-400 text-center uppercase text-xl font-bold tracking-widest"
                                placeholder='AAA 1234'
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-2 rounded-md font-bold tracking-wider"
                            disabled={loading || !plateNumber}
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                "SEARCH"
                            )}
                        </button>
                    </fieldset>
                </form>

                <div className="mt-4 flex flex-col items-center">
                    <p className="text-center text-sm text-base-100 mb-2">
                        Are you from the Traffic Management Office of Talon Kuatro?
                    </p>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                        <Link to="/login" className='text-white hover:text-blue-200 transition-colors underline underline-offset-4'>Login</Link>
                        <span className='text-blue-300'>|</span>
                        <Link to="/register" className='text-white hover:text-blue-200 transition-colors underline underline-offset-4'>Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;