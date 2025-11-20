import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DetailsPage from './pages/DetailsPage.jsx'
import LandingPage from './pages/LandingPage.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LandingPage />} />

        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/apprehension/:id" element={<DetailsPage />} />
      </Routes>
    </div>
  )
}

export default App
