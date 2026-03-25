import React, { useState } from 'react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Info, Code } from "lucide-react";
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            identifier: identifier,
            password: password,
        };

        if (!formData.identifier || !formData.password) {
            return toast.error('Please fill in all fields.');
        }


        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                identifier: formData.identifier,
                password: formData.password,
            });
            navigate('/home');
            console.log("Login Response:", response.data);
            toast.success('Login successful!');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('firstName', response.data.firstName || '');
            localStorage.setItem('lastName', response.data.lastName || '');
            localStorage.setItem('role', response.data.role);
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
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row relative" data-theme="corporateBlue">
            {/* Floating Nav Buttons */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 flex items-center gap-2">
                <Link to="/api-docs" className="btn btn-sm sm:btn-md btn-outline text-white border-white hover:bg-white hover:text-primary rounded-full shadow-lg opacity-90 hover:opacity-100 flex items-center gap-2 bg-primary/20 backdrop-blur-sm">
                    <Code size={18} />
                    <span className="hidden sm:inline">API Docs</span>
                    <span className="sm:hidden">API</span>
                </Link>
                <Link to="/about-system" className="btn btn-sm sm:btn-md btn-outline text-white border-white hover:bg-white hover:text-primary rounded-full shadow-lg opacity-90 hover:opacity-100 flex items-center gap-2 bg-primary/20 backdrop-blur-sm">
                    <Info size={18} />
                    <span className="hidden sm:inline">About SentryAI</span>
                    <span className="sm:hidden">About</span>
                </Link>
            </div>

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
                <form onSubmit={handleSubmit} className="w-full flex justify-center">
                    <fieldset className="fieldset bg-white border-base-300 rounded-xl w-full max-w-lg border p-6 sm:p-8 sm:px-10 space-y-2">
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
                                <span className="label-text text-black">Email or Username</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your email or username"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
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
                                        disabled={loading}
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
                        <button type="submit" className="btn btn-primary mt-2 rounded-sm" disabled={loading}>
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </fieldset>
                </form>
                <div className="mt-4 flex flex-col items-center gap-4">
                    {/* Sign Up Prompt */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-100">Don't have an account?</span>
                        <Link
                            to="/register"
                            className="text-white font-bold hover:text-blue-200 transition-colors underline underline-offset-4"
                        >
                            Sign Up
                        </Link>
                    </div>
                    {/* Back to Home Link */}
                    <Link
                        to="/"
                        className="text-sm font-medium text-white hover:text-blue-200 transition-colors underline underline-offset-4"
                    >
                        &larr; Back to Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;