import React from 'react'
import { Link } from 'react-router'
import { Cctv } from 'lucide-react'

const Navbar = () => {
    return (
        <header className="navbar bg-base-100" data-theme="corporateBlue">
            <div className="navbar-start">
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                        <li><a className='font-semibold'>History</a></li>
                        <li><a className='font-semibold'>Pending</a></li>
                        <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                    </ul>
                </div>
                <Link to={"/"} className="mx-2 text-2xl normal-case font-bold flex items-center space-x-2">
                    <Cctv className='size-7' />
                    <a href="">SentryAI</a>
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><a className='font-semibold'>History</a></li>
                    <li><a className='font-semibold'>Pending</a></li>
                    <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                </ul>
            </div>

            <div className="navbar-end">
                <a href="/login" className="btn btn-ghost">Log In</a>
                <a href="/register" className="btn btn-primary ml-2">Sign Up</a>
            </div>
        </header>
    )
}

export default Navbar
