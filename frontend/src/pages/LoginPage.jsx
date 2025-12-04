import React, { useState } from 'react';
import SentryAILogo from '../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from "lucide-react";
import toast from 'react-hot-toast';
import api from '../lib/axios.js';

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            email: email,
            password: password,
        };

        if (!formData.email || !formData.password) {
            return toast.error('Please fill in all fields.');
        }


        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password,
            });
            navigate('/home');
            console.log("Login Response:", response.data);
            toast.success('Login successful!');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('loggedInUser', response.data.username);
        } catch (error) {
            let errorMessage = 'Login failed. Please try again.'; // Default message
            if (error.response && error.response.data) {
                if (error.response.data.error &&
                    error.response.data.error.details &&
                    error.response.data.error.details[0]) {

                    errorMessage = error.response.data.error.details[0].message;

                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                console.error("API Error:", error.response.data);
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            }
            toast.error(errorMessage);
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

            {/* 2. Right Pane (Sign-up Form) */}
            <div className="flex flex-1 flex-col justify-center items-center bg-primary p-6 md:p-10">
                <h2 className="justify-center text-3xl font-bold text-base-100 mb-4">
                    Welcome
                </h2>
                <form onSubmit={handleSubmit}>
                    <fieldset className="fieldset bg-white border-base-300 rounded-xl w-md border p-8 px-10 space-y-2">
                        <div className='w-full lg:hidden xl:hidden 2xl:hidden mb-4'>
                            <h2 className="w-full text-center text-2xl font-bold text-black">
                                SentryAI
                            </h2>
                            <p className="text-sm text-primary text-center">
                                No Contact Apprehension Policy for Illegal Parking
                            </p>
                        </div>
                        <div>
                            <label className="label">
                                <span className="label-text text-black">Email</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={email} // Set value from state
                                onChange={(e) => setEmail(e.target.value)} // Update state on change
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-black">Password</span>
                            </label>
                            <div className="w-full">
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input input-bordered w-full rounded-md placeholder-gray-500 pr-10" // Added pr-10 to prevent text overlap with icon
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary mt-2 rounded-sm">Login</button>
                    </fieldset>
                </form>
                <p className="text-center text-sm mt-4 text-base-100">
                    Don't have an account?
                    <Link to="/register" className='link ml-1'>Sign Up</Link>
                </p>
                <div className='pt-4'>
                    <p>
                        <Link to="/" className='link mt-4 text-center text-sm text-base-100'>Back to Home Page</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;