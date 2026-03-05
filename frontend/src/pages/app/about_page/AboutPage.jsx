import Navbar from '../../../components/Navbar.jsx'
import { Server, Activity, MonitorSmartphone, Camera, CheckCircle, ShieldAlert, Wifi } from 'lucide-react';

const AboutPage = () => {
    return (
        <div className='min-h-screen bg-gray-50' data-theme="corporateBlue">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">About SentryAI</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        An intelligent No Contact Apprehension Policy (NCAP) system designed to monitor, detect, and record illegal parking violations autonomously.
                    </p>
                </div>

                <div className="space-y-16">

                    {/* SECTION 1: How the system is setup */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#000060] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Server size={28} className="text-blue-300" />
                                How the System is Setup
                            </h2>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-700 leading-relaxed mb-6">
                                SentryAI relies on a distributed architecture consisting of edge detection devices and a centralized cloud management platform.
                            </p>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <Camera size={20} className="text-blue-600" />
                                        Edge Devices (Xiao ESP32S3)
                                    </h3>
                                    <ul className="space-y-3 text-gray-700 list-disc ml-5">
                                        <li className="pl-1">Positioned strategically in no-parking zones.</li>
                                        <li className="pl-1">Powered by <strong>Grove Vision AI V2</strong> for edge AI processing.</li>
                                        <li className="pl-1">Equipped with an <strong>ArduCam SPI Camera</strong> for evidence capture.</li>
                                        <li className="pl-1">Connects via WiFi WebSockets strictly for live video streaming of the detection zone.</li>
                                    </ul>
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <MonitorSmartphone size={20} className="text-blue-600" />
                                        Cloud Platform
                                    </h3>
                                    <ul className="space-y-3 text-gray-700 list-disc ml-5">
                                        <li className="pl-1">Receives apprehension data and stores it securely in a <strong>MongoDB</strong> database.</li>
                                        <li className="pl-1">Integrates with the <strong>Plate Recognizer API</strong> to extract license plate numbers from the ArduCam images.</li>
                                        <li className="pl-1">Hosts this web application dashboard for traffic enforcers to review violations.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: How the system works */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#000060] px-8 py-6">
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
                                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-blue-100 hidden md:block"></div>

                                <div className="space-y-8">
                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-white border-4 border-blue-100 items-center justify-center text-blue-600 font-bold text-xl z-10 shadow-sm">1</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Continuous Monitoring</h3>
                                            <p className="text-gray-600">This is done autonomously by the <strong>Grove Vision AI V2</strong> running a specialized FOMO object detection model to scan for vehicles entering the restricted zone.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-white border-4 border-blue-100 items-center justify-center text-blue-600 font-bold text-xl z-10 shadow-sm">2</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Timer & Validation</h3>
                                            <p className="text-gray-600">This validation is handled by the <strong>Seeed Studio Xiao ESP32S3</strong> microcontroller. If a vehicle remains inside the zone after the apprehension timer expires, an event is triggered and the data is sent to the MongoDB database.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-white border-4 border-blue-100 items-center justify-center text-blue-600 font-bold text-xl z-10 shadow-sm">3</div>
                                        <div className="bg-gray-50 p-6 rounded-2xl flex-1 border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Data Capture</h3>
                                            <p className="text-gray-600">When illegal parking is confirmed, the <strong>ArduCam SPI Camera</strong> captures a high-quality photo evidence frame. Along with the violation details sent to the database, the image is passed to the <strong>Plate Recognizer API</strong> to extract the license plate number.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-white border-4 border-blue-100 items-center justify-center text-blue-600 font-bold text-xl z-10 shadow-sm">4</div>
                                        <div className="bg-red-50 p-6 rounded-2xl flex-1 border border-red-100">
                                            <h3 className="text-lg font-bold text-red-900 mb-2">Enforcer Review</h3>
                                            <p className="text-red-700">The record is pushed to the dashboard as "Pending". An authorized officer reviews the photo evidence, corrects the AI's plate reading if necessary, and marks the record as Approved or Rejected.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: How to use the app */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#000060] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <ShieldAlert size={28} className="text-blue-300" />
                                How to Use the App
                            </h2>
                        </div>
                        <div className="p-8">
                            <div className="grid md:grid-cols-2 gap-8">

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Traffic Enforcers</h3>
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

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">General Public</h3>
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
