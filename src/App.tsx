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
import TeacherSchedulePage from './app/teacher/schedule/page'
import TeacherAttendancePage from './app/teacher/attendance/page'
import TeacherAttendanceDetailPage from './app/teacher/attendance/[sessionId]/page'
import ClassAttendanceMatrixPage from './app/teacher/attendance/classes/[classId]/matrix/page'
import TeacherRequestsPage from './app/teacher/requests/page'
import SelectRequestTypePage from './app/teacher/requests/create/select-type/page'
import SelectSessionPage from './app/teacher/requests/create/select-session/page'
import SelectResourcePage from './app/teacher/requests/create/select-resource/page'
import RequestFormPage from './app/teacher/requests/create/form/page'
import RequestDetailPage from './app/teacher/requests/[id]/page'
import TeacherGradesListPage from './app/teacher/grades/page'
import TeacherGradesPage from './app/teacher/classes/[classId]/grades/page'
import AssessmentScoresPage from './app/teacher/assessments/[assessmentId]/scores/page'
import TeacherStudentsPage from './app/teacher/students/page'
import TeacherProfilePage from './app/teacher/profile/page'
import StudentSchedulePage from './app/student/schedule/page'
import StudentRequestsPage from './app/student/requests/page'
import StudentAttendanceReportOverviewPage from './app/student/attendance-report/page'
import StudentMyClassesPage from './app/student/my-classes/page'
import StudentClassDetailPage from './app/student/my-classes/[classId]/page'
import StudentProfilePage from './app/student/profile/page'
import StudentTranscriptPage from './app/student/transcript/page'
import AcademicClassesPage from './app/academic/classes/page'
import AcademicClassDetailPage from './app/academic/classes/[id]/page'
import AcademicStudentRequestsPage from './app/academic/student-requests/page'
import AcademicTeacherRequestsPage from './app/academic/teacher-requests/page'

import CreateClassPage from './app/academic/classes/create/page'
import EditClassPage from './app/academic/classes/[id]/edit/page'

import CenterHeadApprovalsPage from './app/center-head/approvals/page'
import CurriculumPage from './features/curriculum/pages/CurriculumPage'
import CreateCoursePage from './features/curriculum/pages/CreateCoursePage'
import CreateSubjectPage from './features/curriculum/pages/CreateSubjectPage'
import CreateLevelPage from './features/curriculum/pages/CreateLevelPage'
import CurriculumCourseDetailPage from './features/curriculum/pages/CourseDetailPage'
import EditCoursePage from './features/curriculum/pages/EditCoursePage'
import NotificationsPage from './app/notifications/page'
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

            {/* Notifications */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={["ADMIN"]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher routes */}
            {/* Specific routes must come before general routes */}
            <Route
              path="/teacher/grades"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherGradesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/grades"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assessments/:assessmentId/scores"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <AssessmentScoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance/classes/:classId/matrix"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <ClassAttendanceMatrixPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance/:sessionId"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherAttendanceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/profile"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/schedule"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <TeacherRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-type"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <SelectRequestTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-session"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <SelectSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/select-resource"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <SelectResourcePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/create/form"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <RequestFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests/:id"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "TEACHER",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                    "SUBJECT_LEADER",
                  ]}
                >
                  <RequestDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="/student/attendance-report"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentAttendanceReportOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/schedule"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/requests"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-classes"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentMyClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-classes/:classId"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentClassDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/transcript"
              element={
                <ProtectedRoute requiredRoles={["STUDENT"]}>
                  <StudentTranscriptPage />
                </ProtectedRoute>
              }
            />

            {/* Academic Affairs routes */}
            <Route
              path="/academic/classes"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "ACADEMIC_AFFAIR",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                  ]}
                >
                  <AcademicClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/classes/create"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <CreateClassPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/classes/:id"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "ACADEMIC_AFFAIR",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                  ]}
                >
                  <AcademicClassDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/classes/:id/edit"
              element={
                <ProtectedRoute requiredRoles={['ACADEMIC_AFFAIR', 'ADMIN', 'MANAGER', 'CENTER_HEAD']}>
                  <EditClassPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/student-requests"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "ACADEMIC_AFFAIR",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                  ]}
                >
                  <AcademicStudentRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/teacher-requests"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "ACADEMIC_AFFAIR",
                    "ADMIN",
                    "MANAGER",
                    "CENTER_HEAD",
                  ]}
                >
                  <AcademicTeacherRequestsPage />
                </ProtectedRoute>
              }
            />

            {/* Curriculum routes */}
            <Route
              path="/curriculum"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER', 'MANAGER', 'ADMIN']}>
                  <CurriculumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curriculum/courses/create"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER']}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curriculum/subjects/create"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER', 'MANAGER', 'ADMIN']}>
                  <CreateSubjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curriculum/levels/create"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER', 'MANAGER', 'ADMIN']}>
                  <CreateLevelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curriculum/courses/:id"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER', 'MANAGER', 'ADMIN']}>
                  <CurriculumCourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curriculum/courses/:id/edit"
              element={
                <ProtectedRoute requiredRoles={['SUBJECT_LEADER']}>
                  <EditCoursePage />
                </ProtectedRoute>
              }
            />

            {/* Center Head */}
            <Route
              path="/center-head/approvals"
              element={
                <ProtectedRoute requiredRoles={['CENTER_HEAD']}>
                  <CenterHeadApprovalsPage />
                </ProtectedRoute>
              }
            />

            {/* Root route - redirect based on auth state */}
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/app" element={<AuthRedirect />} />

            {/* Catch all route - redirect based on auth state */}
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ApiSetup>
    </BrowserRouter>
  );
}

export default App;
