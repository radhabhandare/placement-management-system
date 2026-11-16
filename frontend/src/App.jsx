// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Activate from './pages/Activate'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'

import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/Profile'
import StudentJobs from './pages/student/Jobs'
import StudentJobDetail from './pages/student/JobDetail'
import StudentApplications from './pages/student/Applications'
import StudentSaved from './pages/student/Saved'
import StudentNotifications from './pages/student/Notifications'
import StudentPlacementHistory from './pages/student/PlacementHistory'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/Students'
import AdminCompanies from './pages/admin/Companies'
import AdminJobs from './pages/admin/Jobs'
import AdminApplications from './pages/admin/Applications'
import AdminPlacements from './pages/admin/Placements'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate/:token" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Student area */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="jobs" element={<StudentJobs />} />
        <Route path="jobs/:id" element={<StudentJobDetail />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="saved" element={<StudentSaved />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="placement" element={<StudentPlacementHistory />} />
      </Route>

      {/* Admin area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="placements" element={<AdminPlacements />} />
      </Route>

      {/* Public jobs route (redirect to login) */}
      <Route path="/jobs" element={<Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}