import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "https://sentryai.onrender.com";

const api = axios.create({
    baseURL: BASE_URL,
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // If the backend returns 401 Unauthorized (token expired or invalid)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. Logging out...");
            localStorage.removeItem('token');
            localStorage.removeItem('username');

            // Force redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
