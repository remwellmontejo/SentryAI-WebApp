import Navbar from '../../../components/Navbar.jsx'
import PublicNavbar from '../../../components/PublicNavbar.jsx'
import { Server, Activity, MonitorSmartphone, Camera, CheckCircle, ShieldAlert, Wifi, Cpu, Battery, Radio, Eye, Zap } from 'lucide-react';
import about1 from '../../../assets/about_1.png';
import about2 from '../../../assets/about_2.png';

const AboutPage = ({ isPublic = false }) => {
    return (
        <div className='min-h-screen bg-gray-50' data-theme="corporateBlue">
            {isPublic ? <PublicNavbar /> : <Navbar />}

            {/* ===== HERO SECTION ===== */}
            <div className="relative bg-[#000040] overflow-hidden">
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative z-10">
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
                                About <span className="text-blue-400">SentryAI</span>
                            </h1>
                            <p className="text-lg text-blue-100/80 leading-relaxed max-w-lg">
                                An autonomous No Contact Apprehension Policy (NCAP) system designed to monitor, detect, and record illegal parking violations, powered by edge AI and solar energy.
                            </p>
                        </div>
                        <div className="relative flex justify-center lg:justify-end">
                            <div className="relative">
                                {/* Glow effect behind image */}
                                <div className="absolute -inset-8 bg-blue-500/20 rounded-3xl blur-2xl" />
                                <div className="relative rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[600px]">
                                    <img
                                        src={about2}
                                        alt="SentryAI Device"
                                        className="w-full h-full object-cover object-bottom -mt-4"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Bottom curve */}
                <div className="absolute -bottom-px left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
                        <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="#f9fafb" />
                    </svg>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-16">
                    {/* ===== SECTION 1: HARDWARE OVERVIEW WITH IMAGE ===== */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#000060] to-[#000040] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Server size={28} className="text-blue-300" />
                                How the System is Setup
                            </h2>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-700 leading-relaxed mb-8">
                                SentryAI relies on a distributed architecture consisting of edge detection devices and a centralized cloud management platform.
                            </p>

                            {/* Hardware diagram + description side by side */}
                            <div className="grid lg:grid-cols-5 gap-8 mb-8">
                                <div className="lg:col-span-3 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center h-auto lg:h-[520px]">
                                    <img
                                        src={about1}
                                        alt="SentryAI Internal Components Diagram"
                                        className="w-full object-contain lg:object-cover lg:h-[140%] object-center"
                                    />
                                </div>
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 flex-1">
                                        <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                                            <Cpu size={18} className="text-blue-600" />
                                            Key Hardware
                                        </h3>
                                        <ul className="space-y-2.5 text-sm text-gray-700">
                                            <li className="flex items-start gap-2">
                                                <Zap size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>Grove Vision AI V2</strong> — on-device AI inference for real-time vehicle detection</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Camera size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>ArduCam OV5647</strong> — high-quality photo evidence capture</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Eye size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>5MP Night Vision Camera</strong> — built-in IR for low-light operation</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Radio size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>Xiao ESP32S3</strong> — WiFi connectivity & servo motor control</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Battery size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>2000mAh Li-Po + CN3791</strong> — solar-rechargeable power system</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 flex-1">
                                        <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                            <MonitorSmartphone size={18} className="text-indigo-600" />
                                            Cloud Platform
                                        </h3>
                                        <ul className="space-y-2.5 text-sm text-gray-700">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                                <span>Secure <strong>MongoDB</strong> database for violation records and images</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>Plate Recognizer API</strong> for automated license plate extraction</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                                <span>Web dashboard for enforcement officers to review violations</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ===== SECTION 2: HOW THE SYSTEM WORKS ===== */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#000060] to-[#000040] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Activity size={28} className="text-blue-300" />
                                How the System Works
                            </h2>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-700 leading-relaxed mb-8">
                                Data flows seamlessly from the street directly to the Traffic Management Office dashboard.
                            </p>

                            <div className="relative">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-red-200 hidden md:block"></div>

                                <div className="space-y-8">
                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white font-bold text-xl z-10 shadow-lg">1</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100 hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Continuous Monitoring</h3>
                                            <p className="text-gray-600">This is done autonomously by the <strong>Grove Vision AI V2</strong> running a specialized FOMO object detection model to scan for vehicles entering the restricted zone.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white font-bold text-xl z-10 shadow-lg">2</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100 hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Timer & Validation</h3>
                                            <p className="text-gray-600">This validation is handled by the <strong>Seeed Studio Xiao ESP32S3</strong> microcontroller. If a vehicle remains inside the zone after the apprehension timer expires, an event is triggered and the data is sent to the MongoDB database.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white font-bold text-xl z-10 shadow-lg">3</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100 hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Data Capture</h3>
                                            <p className="text-gray-600">When illegal parking is confirmed, the <strong>ArduCam SPI Camera</strong> captures a high-quality photo evidence frame. Along with the violation details sent to the database, the image is passed to the <strong>Plate Recognizer API</strong> to extract the license plate number.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 items-center justify-center text-white font-bold text-xl z-10 shadow-lg">4</div>
                                        <div className="bg-red-50 p-6 rounded-2xl flex-1 border border-red-100 hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-bold text-red-900 mb-2">Enforcer Review</h3>
                                            <p className="text-red-700">The record is pushed to the dashboard as "Pending". An authorized officer reviews the photo evidence, corrects the AI's plate reading if necessary, and marks the record as Approved or Rejected.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ===== SECTION 3: HOW TO USE THE APP ===== */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#000060] to-[#000040] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <ShieldAlert size={28} className="text-blue-300" />
                                How to Use the App
                            </h2>
                        </div>
                        <div className="p-8">
                            <div className="grid md:grid-cols-2 gap-8">

                                <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-blue-200 pb-3">
                                        Traffic Enforcers
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex gap-3">
                                            <div className="text-blue-600 mt-1"><CheckCircle size={20} /></div>
                                            <div>
                                                <strong className="block text-gray-900">Review Violations</strong>
                                                <span className="text-gray-600 text-sm">Go to Dashboard to see pending apprehensions. Review the image, edit plate numbers if they are incorrect, and Approve/Reject records.</span>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="text-blue-600 mt-1"><CheckCircle size={20} /></div>
                                            <div>
                                                <strong className="block text-gray-900">Manage Cameras</strong>
                                                <span className="text-gray-600 text-sm">Use the Cameras tab to view live feeds, manually pan/tilt cameras, map out detection zones, and adjust apprehension timers.</span>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="text-blue-600 mt-1"><Wifi size={20} /></div>
                                            <div>
                                                <strong className="block text-gray-900">Add New Devices</strong>
                                                <span className="text-gray-600 text-sm">Connect a new camera physically to power, connect to its WiFi setup network, and register its Serial Number via the 'Cameras' page.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-gray-300 pb-3">
                                        General Public
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex gap-3">
                                            <div className="text-gray-500 mt-1"><ShieldAlert size={20} /></div>
                                            <div>
                                                <strong className="block text-gray-900">Check Violations</strong>
                                                <span className="text-gray-600 text-sm">Visit the SentryAI homepage and enter exactly 7 characters of your vehicle's license plate.</span>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="text-gray-500 mt-1"><Camera size={20} /></div>
                                            <div>
                                                <strong className="block text-gray-900">View Evidence</strong>
                                                <span className="text-gray-600 text-sm">If an apprehension exists and was Approved by the office, the system will provide the photo evidence with dates and timestamps.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center pb-8">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">SentryAI Platform &copy; 2026</p>
                </div>
            </div>
        </div>
    )
}

export default AboutPage
