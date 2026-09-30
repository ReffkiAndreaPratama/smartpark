import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CameraPage from './pages/CameraPage'
import ParkingPage from './pages/ParkingPage'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import IoTPage from './pages/IoTPage'
import AdminPage from './pages/AdminPage'
import ReservationsPage from './pages/ReservationsPage'
import SettingsPage from './pages/SettingsPage'
import AboutPage from './pages/AboutPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="camera" element={<CameraPage />} />
        <Route path="parking" element={<ParkingPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="iot" element={<IoTPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
