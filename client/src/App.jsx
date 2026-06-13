import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import DoctorSchedulePage from './pages/DoctorSchedulePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MedicalProfilePage from './pages/MedicalProfilePage.jsx';
import PatientBookingPage from './pages/PatientBookingPage.jsx';
import SecurityPage from './pages/SecurityPage.jsx';
import SystemPage from './pages/SystemPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/book" element={<PatientBookingPage />} />
          <Route path="/medical-profile" element={<MedicalProfilePage />} />
          <Route path="/schedule" element={<DoctorSchedulePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/operations" element={<SystemPage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
