import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthRedirect } from '@/components/AuthRedirect'
import { ApiSetup } from '@/components/ApiSetup'
import DashboardPage from './app/dashboard/page'
import LoginPage from './app/login/page'
import AdminUsersPage from './app/admin/users/page'
import TeacherClassesPage from './app/teacher/classes/page'
import StudentCoursesPage from './app/student/courses/page'
import StudentSchedulePage from './app/student/schedule/page'
import StudentAbsencePage from './app/student/absence/page'
import AcademicClassesPage from './app/academic/classes/page'
import AcademicClassDetailPage from './app/academic/classes/[id]/page'
import AcademicAbsenceRequestsPage from './app/academic/absence-requests/page'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <ApiSetup>
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
            <Route
              path="/student/schedule"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/absence"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentAbsencePage />
                </ProtectedRoute>
              }
            />

            {/* Academic Affairs routes */}
            <Route
              path="/academic/classes"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <AcademicClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/classes/:id"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <AcademicClassDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/absence-requests"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <AcademicAbsenceRequestsPage />
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
      </ApiSetup>
    </BrowserRouter>
  )
}

export default App
