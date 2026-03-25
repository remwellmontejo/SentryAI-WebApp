import { Routes, Route, Router } from 'react-router'
import { Toaster } from 'react-hot-toast'; // <--- 1. ADD THIS IMPORT

import HomePage from './pages/home/HomePage.jsx'
import AboutPage from './pages/app/about_page/AboutPage.jsx'
import ApiDocsPage from './pages/app/api_docs_page/ApiDocsPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import LandingPage from './pages/auth/LandingPage.jsx'
import CamerasPage from './pages/app/cameras_page/CamerasPage.jsx'
import CameraDetailsPage from './pages/app/cameras_page/CameraDetailsPage.jsx'
import CarDetailsPage from './pages/app/details_page/CarDetailsPage.jsx'
import CameraRegisterPage from './pages/app/cameras_page/CameraRegisterPage.jsx'
import CameraSettingsPage from './pages/app/cameras_page/CameraSettingsPage.jsx'
import EditApprehensionPage from './pages/app/details_page/EditApprehensionPage.jsx'
import ApprehensionsPage from './pages/app/apprehensions_page/ApprehensionsPage.jsx'
import RejectsPage from './pages/app/apprehensions_page/RejectsPage.jsx'
import ResolvedPage from './pages/app/apprehensions_page/ResolvedPage.jsx'
import ProtectedRoute from './components/ProtectedComponent.jsx'
import ApprehensionSearchPage from './pages/auth/ApprehensionSearchPage.jsx'
import PublicApprehensionDetailsPage from './pages/auth/PublicApprehensionDetailsPage.jsx'
import AccountsPage from './pages/admin/AccountsPage.jsx'
import LogsPage from './pages/admin/LogsPage.jsx'

const App = () => {
  return (
    <div>
      {/* 2. ADD THE TOASTER HERE */}
      <Toaster
        position="top-center"
        containerStyle={{ top: 30 }}
        reverseOrder={false}
        toastOptions={{
          style: {
            border: '1px solid #cbd5e1',
          },
        }}
        duration={1000}
      />

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/about-system" element={<AboutPage isPublic={true} />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/public-results/:plateNumber" element={<ApprehensionSearchPage />} />
        <Route path="/public-details/:id" element={<PublicApprehensionDetailsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/accounts" element={<AccountsPage />} />
          <Route path="/admin/logs" element={<LogsPage />} />
          <Route path="/apprehensions/rejects" element={<RejectsPage />} />
          <Route path="/apprehensions/resolved" element={<ResolvedPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/apprehensions" element={<ApprehensionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cameras" element={<CamerasPage />} />
          <Route path="/cameras/register" element={<CameraRegisterPage />} />
          <Route path="/cameras/:serialNumber" element={<CameraDetailsPage />} />
          <Route path="/apprehension/:id" element={<CarDetailsPage />} />
          <Route path="/cameras/settings/:serialNumber" element={<CameraSettingsPage />} />
          <Route path="/apprehension/edit/:id" element={<EditApprehensionPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App