import React, { useState } from 'react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import axios from 'axios';

function LandingPage() {
    const [plateNumber, setPlateNumber] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

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

            {/* 2. Right Pane (Sign-up Form) */}
            <div className="flex flex-1 flex-col justify-center items-center bg-primary p-6 md:p-10">
                <h2 className="justify-center text-3xl font-bold text-base-100 mb-4">
                    Have you been apprehended?
                </h2>
                <form onSubmit={handleSubmit}>
                    <fieldset className="fieldset bg-white border-base-300 rounded-xl w-md border p-8 px-10 space-y-2">
                        <div className='w-full'>
                            <h2 className="w-full text-center text-2xl font-bold text-black">
                                Plate Number
                            </h2>
                        </div>
                        <div>
                            <input
                                type="input"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                placeholder='Type your plate number here'
                                value={plateNumber} // Set value from state
                                onChange={(e) => setPlateNumber(e.target.value)} // Update state on change
                            />
                        </div>
                        <button type="submit" className="btn btn-primary mt-2 rounded-sm">Search</button>
                    </fieldset>
                </form>
                <p className="text-center text-sm mt-4 text-base-100">
                    Are you from the Traffic Management Office of Talon Kuatro?
                </p>
                <div className='flex'>
                    <Link to="/login" className='text-base-100 link mr-1'>Login</Link>
                    <p className='text-base-100'> | </p>
                    <Link to="/register" className='text-base-100 link ml-1'>Sign Up</Link>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;