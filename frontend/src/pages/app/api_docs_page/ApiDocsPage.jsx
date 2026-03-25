import { useState } from 'react';
import PublicNavbar from '../../../components/PublicNavbar.jsx';
import { Code, Key, Server, ChevronDown, ChevronUp, Copy, Check, BookOpen, Shield, Zap, FileJson, ArrowRight } from 'lucide-react';

const CodeBlock = ({ code, language = 'bash' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden border border-gray-700 bg-[#0d1117]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{language}</span>
                <button
                    onClick={handleCopy}
                    className="btn btn-ghost btn-xs text-gray-400 hover:text-white gap-1"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code className="text-gray-300 font-mono whitespace-pre">{code}</code>
            </pre>
        </div>
    );
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon size={20} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>
                {open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {open && (
                <div className="px-6 pb-6 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
};

const ApiDocsPage = () => {
    return (
        <div className='min-h-screen bg-gray-50' data-theme="corporateBlue">
            <PublicNavbar />

            {/* ===== HERO SECTION ===== */}
            <div className="relative bg-[#000040] overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
                                <Zap size={14} className="text-blue-300" />
                                <span className="text-sm font-medium text-blue-200">External Integration API</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
                                API <span className="text-blue-400">Documentation</span>
                            </h1>
                            <p className="text-lg text-blue-100/80 leading-relaxed max-w-lg">
                                Retrieve approved apprehension records from SentryAI for use in your traffic ticketing and enforcement systems.
                            </p>
                        </div>
                        <div className="relative flex justify-center lg:justify-end">
                            <div className="bg-[#0d1117] rounded-2xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-500 ml-2 font-mono">terminal</span>
                                </div>
                                <pre className="text-sm font-mono text-gray-300 leading-relaxed">
                                    <span className="text-green-400">$</span> curl -H <span className="text-yellow-300">"Authorization: Bearer &lt;TOKEN&gt;"</span> \{'\n'}
                                    {'  '}<span className="text-blue-300">/api/external/apprehensions</span>{'\n\n'}
                                    <span className="text-gray-500">{'{'}</span>{'\n'}
                                    {'  '}<span className="text-blue-300">"success"</span>: <span className="text-green-300">true</span>,{'\n'}
                                    {'  '}<span className="text-blue-300">"data"</span>: <span className="text-gray-500">[...]</span>{'\n'}
                                    <span className="text-gray-500">{'}'}</span>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-px left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
                        <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="#f9fafb" />
                    </svg>
                </div>
            </div>

            {/* ===== CONTENT ===== */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-6">

                    {/* QUICK START OVERVIEW */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#000060] to-[#000040] px-8 py-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <BookOpen size={28} className="text-blue-300" />
                                Quick Start
                            </h2>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-700 leading-relaxed mb-6">
                                The SentryAI External API allows authorized traffic authority systems to programmatically retrieve
                                approved vehicle apprehension records. All requests require a valid API token.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 text-center">
                                    <Server size={28} className="text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-bold text-gray-900 mb-1">Base URL</h4>
                                    <code className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded font-mono">/api/external/apprehensions</code>
                                </div>
                                <div className="bg-green-50/60 p-5 rounded-2xl border border-green-100 text-center">
                                    <Shield size={28} className="text-green-600 mx-auto mb-3" />
                                    <h4 className="font-bold text-gray-900 mb-1">Auth Method</h4>
                                    <code className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded font-mono">Bearer Token</code>
                                </div>
                                <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 text-center">
                                    <FileJson size={28} className="text-purple-600 mx-auto mb-3" />
                                    <h4 className="font-bold text-gray-900 mb-1">Format</h4>
                                    <code className="text-sm text-purple-700 bg-purple-100 px-2 py-1 rounded font-mono">JSON</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AUTHENTICATION */}
                    <CollapsibleSection title="Authentication" icon={Key} defaultOpen={true}>
                        <div className="pt-5 space-y-4">
                            <p className="text-gray-700">
                                All API requests must include your API token in the <code className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">Authorization</code> header using the Bearer scheme.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-amber-800 text-sm font-medium">
                                    ⚠️ Keep your API token secure. Do not expose it in client-side code or public repositories. Contact the SentryAI administrator to request a token.
                                </p>
                            </div>
                            <CodeBlock
                                language="http"
                                code={`GET /api/external/apprehensions HTTP/1.1
Host: sentryai.onrender.com
Authorization: Bearer YOUR_API_TOKEN`}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* GET APPROVED APPREHENSIONS */}
                    <CollapsibleSection title="GET  /api/external/apprehensions" icon={Code} defaultOpen={true}>
                        <div className="pt-5 space-y-6">
                            <p className="text-gray-700">
                                Returns a paginated list of all approved apprehension records, including vehicle images and camera information.
                            </p>

                            {/* Query Parameters */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <ArrowRight size={16} className="text-blue-500" />
                                    Query Parameters
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="table w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-gray-700 font-bold">Parameter</th>
                                                <th className="text-gray-700 font-bold">Type</th>
                                                <th className="text-gray-700 font-bold">Default</th>
                                                <th className="text-gray-700 font-bold">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">page</code></td>
                                                <td className="text-gray-600">number</td>
                                                <td><code className="font-mono text-sm">1</code></td>
                                                <td className="text-gray-600">Page number for pagination</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">limit</code></td>
                                                <td className="text-gray-600">number</td>
                                                <td><code className="font-mono text-sm">20</code></td>
                                                <td className="text-gray-600">Results per page (max: 100)</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">plateNumber</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-400">—</td>
                                                <td className="text-gray-600">Filter by exact plate number</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Response Fields */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <ArrowRight size={16} className="text-blue-500" />
                                    Response Fields
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="table w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-gray-700 font-bold">Field</th>
                                                <th className="text-gray-700 font-bold">Type</th>
                                                <th className="text-gray-700 font-bold">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">_id</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Unique record identifier</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">plateNumber</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Detected license plate number</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">vehicleType</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">"Car" or "Motorcycle"</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">status</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Always "Approved" for this endpoint</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">sceneImageBase64</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Base64-encoded JPEG photo evidence</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">confidenceScore</code></td>
                                                <td className="text-gray-600">number</td>
                                                <td className="text-gray-600">AI detection confidence (0–100)</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">cameraSerialNumber</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Serial number of the detecting camera</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">camera</code></td>
                                                <td className="text-gray-600">object</td>
                                                <td className="text-gray-600">Camera details (name, serialNumber, location)</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">approvedBy</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">Name of the officer who approved</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">createdAt</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">ISO 8601 timestamp of apprehension</td>
                                            </tr>
                                            <tr>
                                                <td><code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">updatedAt</code></td>
                                                <td className="text-gray-600">string</td>
                                                <td className="text-gray-600">ISO 8601 timestamp of last update</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Example Response */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <ArrowRight size={16} className="text-blue-500" />
                                    Example Response
                                </h4>
                                <CodeBlock
                                    language="json"
                                    code={`{
  "success": true,
  "message": "Approved apprehensions retrieved successfully",
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 45,
    "limit": 20
  },
  "data": [
    {
      "_id": "6654a1b2c3d4e5f6a7b8c9d0",
      "vehicleType": "Car",
      "plateNumber": "ABC1234",
      "confidenceScore": 92,
      "status": "Approved",
      "cameraSerialNumber": "SN-001",
      "sceneImageBase64": "/9j/4AAQSkZJRg...",
      "approvedBy": "Juan Dela Cruz",
      "camera": {
        "name": "Main Gate Camera",
        "serialNumber": "SN-001",
        "location": "Intersection A"
      },
      "createdAt": "2026-03-20T08:15:30.000Z",
      "updatedAt": "2026-03-20T09:00:12.000Z"
    }
  ]
}`}
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* CODE EXAMPLES */}
                    <CollapsibleSection title="Code Examples" icon={Code} defaultOpen={false}>
                        <div className="pt-5 space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">cURL</h4>
                                <CodeBlock
                                    language="bash"
                                    code={`# Fetch all approved apprehensions
curl -X GET "https://sentryai.onrender.com/api/external/apprehensions" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"

# With pagination
curl -X GET "https://sentryai.onrender.com/api/external/apprehensions?page=2&limit=10" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Filter by plate number
curl -X GET "https://sentryai.onrender.com/api/external/apprehensions?plateNumber=ABC1234" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`}
                                />
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">JavaScript (fetch)</h4>
                                <CodeBlock
                                    language="javascript"
                                    code={`const response = await fetch(
  "https://sentryai.onrender.com/api/external/apprehensions?page=1&limit=20",
  {
    method: "GET",
    headers: {
      "Authorization": "Bearer YOUR_API_TOKEN"
    }
  }
);

const data = await response.json();

if (data.success) {
  console.log(\`Found \${data.pagination.totalRecords} records\`);
  data.data.forEach(record => {
    console.log(\`Plate: \${record.plateNumber}, Type: \${record.vehicleType}\`);
  });
}`}
                                />
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">Python (requests)</h4>
                                <CodeBlock
                                    language="python"
                                    code={`import requests

url = "https://sentryai.onrender.com/api/external/apprehensions"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN"
}
params = {
    "page": 1,
    "limit": 20
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

if data["success"]:
    for record in data["data"]:
        print(f"Plate: {record['plateNumber']}, "
              f"Type: {record['vehicleType']}, "
              f"Date: {record['createdAt']}")`}
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* ERROR CODES */}
                    <CollapsibleSection title="Error Responses" icon={Shield} defaultOpen={false}>
                        <div className="pt-5">
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="table w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="text-gray-700 font-bold">Status Code</th>
                                            <th className="text-gray-700 font-bold">Meaning</th>
                                            <th className="text-gray-700 font-bold">Example Response</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <span className="badge badge-error text-white font-mono">401</span>
                                            </td>
                                            <td className="text-gray-700 font-medium">No token provided</td>
                                            <td>
                                                <code className="text-sm font-mono text-gray-600">
                                                    {`{ "success": false, "message": "Access Denied. No API token provided." }`}
                                                </code>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className="badge badge-error text-white font-mono">401</span>
                                            </td>
                                            <td className="text-gray-700 font-medium">Invalid token</td>
                                            <td>
                                                <code className="text-sm font-mono text-gray-600">
                                                    {`{ "success": false, "message": "Invalid API token." }`}
                                                </code>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className="badge badge-warning font-mono">500</span>
                                            </td>
                                            <td className="text-gray-700 font-medium">Server error</td>
                                            <td>
                                                <code className="text-sm font-mono text-gray-600">
                                                    {`{ "success": false, "message": "Server error fetching apprehensions" }`}
                                                </code>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>

                <div className="mt-12 text-center pb-8">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">SentryAI Platform &copy; 2026</p>
                </div>
            </div>
        </div>
    );
};

export default ApiDocsPage;
