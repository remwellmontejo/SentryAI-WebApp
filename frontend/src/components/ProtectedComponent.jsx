
import { Navigate, Outlet } from 'react-router';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // If there is no token in local storage, redirect them to the login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, render the child routes (e.g., Dashboard, Camera Settings)
    return <Outlet />;
};

export default ProtectedRoute;