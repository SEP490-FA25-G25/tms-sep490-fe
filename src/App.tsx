import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthRedirect } from '@/components/AuthRedirect'
import { ApiSetup } from '@/components/ApiSetup'
import LandingPage from './app/page'
import DashboardPage from './app/dashboard/page'
import LoginPage from './app/login/page'
import AdminUsersPage from './app/admin/users/page'
import TeacherClassesPage from './app/teacher/classes/page'
import TeacherAttendancePage from './app/teacher/attendance/page'
import TeacherAttendanceDetailPage from './app/teacher/attendance/[sessionId]/page'
import ClassAttendanceMatrixPage from './app/teacher/attendance/classes/[classId]/matrix/page'
import TeacherRequestsPage from './app/teacher/requests/page'
import SelectRequestTypePage from './app/teacher/requests/create/select-type/page'
import SelectSessionPage from './app/teacher/requests/create/select-session/page'
import SelectResourcePage from './app/teacher/requests/create/select-resource/page'
import RequestFormPage from './app/teacher/requests/create/form/page'
import RequestDetailPage from './app/teacher/requests/[id]/page'
import StudentCoursesPage from './app/student/courses/page'
import CourseDetailPage from './app/student/courses/[id]/page'
import StudentSchedulePage from './app/student/schedule/page'
import StudentRequestsPage from './app/student/requests/page'
import StudentAttendanceReportOverviewPage from './app/student/attendance-report/page'
import StudentClassAttendanceReportPage from './app/student/attendance-report/[classId]/page'
import StudentMyClassesPage from './app/student/my-classes/page'
import StudentClassDetailPage from './app/student/my-classes/[classId]/page'
import StudentProfilePage from './app/student/profile/page'
import AcademicClassesPage from './app/academic/classes/page'
import AcademicClassDetailPage from './app/academic/classes/[id]/page'
import AcademicStudentRequestsPage from './app/academic/student-requests/page'
import AcademicTeacherRequestsPage from './app/academic/teacher-requests/page'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <ApiSetup>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
            <Route
              path="/teacher/attendance/:sessionId"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <TeacherAttendanceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <TeacherAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance/classes/:classId/matrix"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <ClassAttendanceMatrixPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <TeacherRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-type"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <SelectRequestTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-session"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <SelectSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-resource"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <SelectResourcePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/form"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <RequestFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/:id"
              element={
                <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'MANAGER', 'CENTER_HEAD', 'SUBJECT_LEADER']}>
                  <RequestDetailPage />
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
              path="/student/courses/:id"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance-report"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentAttendanceReportOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance-report/:classId"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentClassAttendanceReportPage />
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
              path="/student/requests"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-classes"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentMyClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-classes/:classId"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentClassDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requiredRoles={['STUDENT']}>
                  <StudentProfilePage />
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
              path="/academic/student-requests"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <AcademicStudentRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/teacher-requests"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <AcademicTeacherRequestsPage />
                </ProtectedRoute>
              }
            />

            {/* Route dành cho chuyển hướng dựa trên trạng thái đăng nhập */}
            <Route path="/app" element={<AuthRedirect />} />

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
