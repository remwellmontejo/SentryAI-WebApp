import { Routes, Route } from 'react-router'
import HomePage from './pages/home/HomePage.jsx'
import AboutPage from './pages/app/about_page/AboutPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import LandingPage from './pages/auth/LandingPage.jsx'
import CamerasPage from './pages/app/cameras_page/CamerasPage.jsx'
import CameraDetailsPage from './pages/app/cameras_page/CameraDetailsPage.jsx'
import CarDetailsPage from './pages/app/details_page/CarDetailsPage.jsx'
import CameraSettingsPage from './pages/app/cameras_page/CameraSettingsPage.jsx'
import EditApprehensionPage from './pages/app/details_page/EditApprehensionPage.jsx'
import ApprehensionsPage from './pages/app/apprehensions_page/ApprehensionsPage.jsx'
import RejectsPage from './pages/app/apprehensions_page/RejectsPage.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/apprehensions/rejects" element={<RejectsPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/apprehensions" element={<ApprehensionsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cameras" element={<CamerasPage />} />
        <Route path="/cameras/:serialNumber" element={<CameraDetailsPage />} />
        <Route path="/apprehension/:id" element={<CarDetailsPage />} />
        <Route path="/cameras/settings/:serialNumber" element={<CameraSettingsPage />} />
        <Route path="/apprehension/edit/:id" element={<EditApprehensionPage />} />
      </Routes>
    </div>
  )
}

export default App
