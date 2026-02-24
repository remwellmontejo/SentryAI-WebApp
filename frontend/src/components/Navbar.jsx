import React from 'react'
import SentryAILogo from '../assets/sentry-ai-logo.svg';
import { Link } from 'react-router'
import { List } from 'lucide-react'

const Navbar = () => {
    return (
        <header className="navbar bg-base-100 shadow-md" data-theme="corporateBlue">
            <div className="navbar-start">
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost lg:hidden">
                        <List size={25} className=''></List>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link to={"/home"} className='font-semibold'>Home</Link></li>
                        <li><Link to={"/apprehensions"} className='font-semibold'>Apprehensions</Link></li>
                        <li><Link to={"/cameras"} className='font-semibold'>Cameras</Link></li>
                        <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                    </ul>
                </div>
                <Link to={"/home"} className="mx-2 text-2xl normal-case font-bold flex items-center space-x-2">
                    <img src={SentryAILogo} className="w-10 h-10 mx-auto" />
                    <a href="" className='ml-2'>SentryAI</a>
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to={"/home"} className='font-semibold'>Home</Link></li>
                    <li><Link to={"/apprehensions"} className='font-semibold'>Apprehensions</Link></li>
                    <li><Link to={"/cameras"} className='font-semibold'>Cameras</Link></li>
                    <li><Link to={"/about"} className='font-semibold'>About</Link></li>
                </ul>
            </div>

            <div className="navbar-end">
                <a className="btn btn-primary ml-2"><Link to={"/"}>Log Out</Link></a>
            </div>
        </header>
    )
}

export default Navbar
