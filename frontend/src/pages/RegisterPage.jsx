import React, { useState } from 'react';
import SentryAILogo from '../assets/sentry-ai-logo.svg?react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import axios from 'axios';

function RegisterPage() {

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            username: username,
            email: email,
            password: password,
            confirmPassword: confirmPassword,
        };

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            return toast.error('Please fill in all fields.');
        }

        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match.');
        }

        try {
            await axios.post('http://localhost:5001/auth/register', {
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
        <div className="flex min-h-screen flex-col lg:flex-row" data- theme="corporateBlue" >

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
                                <span className="label-text text-black">Username</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Choose a username"
                                className="input input-bordered w-full rounded-md placeholder-gray-500"
                                value={username} // Set value from state
                                onChange={(e) => setUsername(e.target.value)} // Update state on change
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
                <p className="text-center text-sm mt-4 text-base-100">
                    Already have an account?
                    <Link to="/login" className='link ml-1'>Login</Link>
                </p>

                <div className='pt-4'>
                    <p>
                        <Link to="/" className='link mt-4 text-center text-sm text-base-100'>Back to Home Page</Link>
                    </p>
                </div>
            </div >
        </div >
    );
}

export default RegisterPage;