import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthRedirect } from '@/components/AuthRedirect'
import DashboardPage from './app/dashboard/page'
import LoginPage from './app/login/page'
import AdminUsersPage from './app/admin/users/page'
import TeacherClassesPage from './app/teacher/classes/page'
import StudentCoursesPage from './app/student/courses/page'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                <TeacherClassesPage />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute requiredRoles={['STUDENT']}>
                <StudentCoursesPage />
              </ProtectedRoute>
            }
          />

          {/* Root route - redirect based on auth state */}
          <Route path="/" element={<AuthRedirect />} />

          {/* Catch all route - redirect based on auth state */}
          <Route path="*" element={<AuthRedirect />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

