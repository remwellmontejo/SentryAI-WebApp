import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Wifi, Camera as CameraIcon, CheckCircle, Info, Loader } from 'lucide-react';
import api from "../../../lib/axios";
import Navbar from "../../../components/Navbar";
import toast from 'react-hot-toast';

const CameraRegisterPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        serialNumber: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNextStep = () => {
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.serialNumber) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/cameras/register', formData);
            toast.success("Camera registered successfully!");
            navigate('/cameras');
        } catch (error) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.message || "Failed to register camera";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50" data-theme="corporateBlue">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/cameras')}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium mb-4"
                    >
                        <ArrowLeft size={20} /> Back to Cameras
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Register New Camera</h1>
                        <p className="text-gray-500 mt-1">Add a new SentryAI apprehension unit to the system</p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-10">
                    <div className="flex items-center w-full max-w-md">
                        <div className={`flex flex-col items-center relative z-10 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 bg-white ${step >= 1 ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}`}>
                                1
                            </div>
                            <span className="absolute top-12 text-xs font-bold uppercase tracking-wider w-32 text-center">WiFi Setup</span>
                        </div>
                        <div className={`flex-1 h-1 mx-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex flex-col items-center relative z-10 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 bg-white ${step >= 2 ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}`}>
                                2
                            </div>
                            <span className="absolute top-12 text-xs font-bold uppercase tracking-wider w-32 text-center">Registration</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-16">

                    {/* STEP 1: WiFi Setup */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <Wifi size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Connect Device to WiFi</h2>
                                </div>

                                <div className="space-y-6 text-gray-700">
                                    <p className="text-lg">
                                        Before registering the camera, you need to connect it to the local network using the built-in WiFi Manager.
                                    </p>

                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 space-y-4">
                                        <h3 className="font-bold text-blue-900 text-lg uppercase tracking-wide">Instructions</h3>

                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">1</div>
                                            <p className="mt-1">Power on the camera unit.</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">2</div>
                                            <p className="mt-1">Using your phone or laptop, connect to the WiFi network named <strong>"SentryAI Setup"</strong>.</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">3</div>
                                            <p className="mt-1">A portal should open automatically. If not, open a browser and go to <strong>192.168.4.1</strong>.</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">4</div>
                                            <p className="mt-1">Select your local WiFi network, enter the password, and save.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                                        <Info className="flex-shrink-0 mt-0.5" size={20} />
                                        <p className="text-sm font-medium">Wait for the device to connect successfully before proceeding to the next step.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleNextStep}
                                    className="btn btn-primary px-8 flex items-center gap-2"
                                >
                                    Proceed to Register <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Registration Form */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <form onSubmit={handleRegister}>
                                <div className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                            <CameraIcon size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Define Identity</h2>
                                    </div>

                                    <div className="space-y-6">

                                        <div className="flex items-start gap-3 p-4 mb-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
                                            <Info className="flex-shrink-0 mt-0.5" size={20} />
                                            <p className="text-sm font-medium leading-relaxed">
                                                Please find the <strong>Serial Number</strong> printed on the device prototype or its original packaging. This identifier is permanent and <strong>cannot be edited later</strong>.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Camera Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
                                                placeholder="e.g. Talon Kuatro Main Gate"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Serial Number</label>
                                            <input
                                                type="text"
                                                name="serialNumber"
                                                value={formData.serialNumber}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 font-mono tracking-wider uppercase"
                                                placeholder="e.g. CAM-12345"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                                        disabled={loading}
                                    >
                                        Back to Step 1
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary px-8 flex items-center gap-2"
                                    >
                                        {loading ? <Loader className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                        Complete Registration
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CameraRegisterPage;
