import React, { useState } from 'react';
import SentryAILogo from '../../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../../lib/axios.js';

function RegisterPage() {

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: password,
            confirmPassword: confirmPassword,
        };

        if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            return toast.error('Please fill in all fields.');
        }

        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match.');
        }

        try {
            await api.post('/auth/register', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            navigate('/login');
            toast.success('Registration successful! Please wait for account activation.');
        } catch (error) {
            let errorMessage = 'The registration failed. Please try again.'; // Default message
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
        <div className="flex min-h-screen flex-col lg:flex-row relative" data-theme="corporateBlue" >
            {/* Floating About Button */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50">
                <Link to="/about-system" className="btn btn-sm sm:btn-md btn-outline text-white border-white hover:bg-white hover:text-primary rounded-full shadow-lg opacity-90 hover:opacity-100 flex items-center gap-2 bg-primary/20 backdrop-blur-sm">
                    <Info size={18} />
                    <span className="hidden sm:inline">About SentryAI</span>
                    <span className="sm:hidden">About</span>
                </Link>
            </div>

            {/* 1. Left Pane (Logo & Brand) */}
            < div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center bg-base-100 text-neutral-content p-10 relative shadow-2xl" >
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
            </div >

            {/* 2. Right Pane (Sign-up Form) */}
            < div className="flex flex-1 flex-col justify-center items-center bg-primary p-6 md:p-10" >
                <h2 className="justify-center text-3xl font-bold text-base-100 mb-4">
                    Create your Account
                </h2>
                <form onSubmit={handleSubmit}>
                    <fieldset className="fieldset bg-white border-base-300 rounded-xl w-full max-w-lg border p-6 sm:p-8 sm:px-10 space-y-2">
                        <div className='w-full lg:hidden xl:hidden 2xl:hidden mb-4'>
                            <h2 className="w-full text-center text-2xl font-bold text-black">
                                SentryAI
                            </h2>
                            <p className="text-sm text-primary text-center">
                                No Contact Apprehension Policy for Illegal Parking
                            </p>
                        </div>
                        {/* First Name & Last Name (side by side) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">
                                    <span className="label-text text-black">First Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="First name"
                                    className="input input-bordered w-full rounded-md placeholder-gray-500"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">
                                    <span className="label-text text-black">Last Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    className="input input-bordered w-full rounded-md placeholder-gray-500"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-black">Username</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Choose a username"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-black">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={email} // Set value from state
                                onChange={(e) => setEmail(e.target.value)} // Update state on change
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-black">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Create a strong password"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={password} // Set value from state
                                onChange={(e) => setPassword(e.target.value)} // Update state on change
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-black">Confirm Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm your password"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={confirmPassword} // Set value from state
                                onChange={(e) => setConfirmPassword(e.target.value)} // Update state on change
                            />
                        </div>

                        <div className="card card-dash bg-base-100 border-info mt-2">
                            <div className="text-xs p-4 text-justify card-body">
                                <p>Newly created accounts must be activated by an administrator before used for login.</p>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary mt-2 rounded-sm">Sign Up</button>
                    </fieldset>
                </form>
                <div className="mt-4 flex flex-col items-center gap-4">
                    {/* Sign Up Prompt */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-100">Already have an account?</span>
                        <Link
                            to="/login"
                            className="text-white font-bold hover:text-blue-200 transition-colors underline underline-offset-4"
                        >
                            Login
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
            </div >
        </div >
    );
}

export default RegisterPage;