import { Routes, Route, Router } from 'react-router'
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
import ProtectedRoute from './components/ProtectedComponent.jsx'
import ApprehensionSearchPage from './pages/home/ApprehensionSearchPage.jsx'
import PublicApprehensionDetailsPage from './pages/home/PublicApprehensionDetailsPage.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/public-results/:plateNumber" element={<ApprehensionSearchPage />} />
        <Route path="/public-details/:id" element={<PublicApprehensionDetailsPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/apprehensions/rejects" element={<RejectsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/apprehensions" element={<ApprehensionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cameras" element={<CamerasPage />} />
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
