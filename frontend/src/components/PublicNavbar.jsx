import React from 'react';
import SentryAILogo from '../assets/sentry-ai-logo.svg';
import { Link } from 'react-router';

const PublicNavbar = () => {
    return (
        <header className="navbar bg-base-100 shadow-md relative z-50 px-4 sm:px-8" data-theme="corporateBlue">
            <div className="navbar-start">
                <Link to={"/"} className="text-2xl normal-case font-bold flex items-center space-x-2">
                    <img src={SentryAILogo} alt="SentryAI Logo" className="w-10 h-10" />
                    <span className="ml-2">SentryAI</span>
                </Link>
            </div>
            
            <div className="navbar-end flex items-center gap-2 sm:gap-4">
                <Link
                    to="/login"
                    className="btn btn-ghost text-sm font-bold"
                >
                    Login
                </Link>
                <Link
                    to="/"
                    className="btn btn-primary text-sm font-bold"
                >
                    Back to Home
                </Link>
            </div>
        </header>
    );
};

export default PublicNavbar;
