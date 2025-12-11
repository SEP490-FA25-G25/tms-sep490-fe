import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthRedirect } from "@/components/dashboard/AuthRedirect";
import { ApiSetup } from "@/components/ApiSetup";
import { Toaster } from "@/components/ui/sonner";

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);
const CourseApprovalPage = lazy(() => import("./app/curriculum/approval/page"));

// Lazy load all pages
const LandingPage = lazy(() => import("./app/page"));
const PublicCourseDetailPage = lazy(
  () => import("./app/public-course-detail/page")
);
const DashboardPage = lazy(() => import("./app/dashboard/page"));
const LoginPage = lazy(() => import("./app/login/page"));
const ForgotPasswordPage = lazy(() => import("./app/forgot-password/page"));
const ResetPasswordPage = lazy(() => import("./app/reset-password/page"));
const SchedulePage = lazy(() => import("./app/schedule/page"));
const NotificationsPage = lazy(() => import("./app/notifications/page"));

// Admin pages
const AdminUsersPage = lazy(() => import("./app/admin/users/page"));
const AdminCentersPage = lazy(() => import("./app/admin/centers/page"));
const AdminSubjectsPage = lazy(() => import("./app/admin/subjects/page"));
const AdminAnalyticsPage = lazy(() => import("./app/admin/analytics/page"));
const AdminDashboardPage = lazy(() => import("./app/admin/dashboard/page"));
const AdminProfilePage = lazy(() => import("./app/admin/profile/page"));

// Teacher pages
const TeacherClassesPage = lazy(() => import("./app/teacher/classes/page"));
const TeacherClassDetailPage = lazy(
  () => import("./app/teacher/classes/[classId]/page")
);

// Redirect component for /teacher/classes/:classId/students
const TeacherClassStudentsRedirect = () => {
  const { classId } = useParams<{ classId: string }>();
  return <Navigate to={`/teacher/classes/${classId}`} replace />;
};

const TeacherSchedulePage = lazy(() => import("./app/teacher/schedule/page"));
const TeacherAttendancePage = lazy(
  () => import("./app/teacher/attendance/page")
);
const TeacherAttendanceDetailPage = lazy(
  () => import("./app/teacher/attendance/[sessionId]/page")
);
const ClassAttendanceMatrixPage = lazy(
  () => import("./app/teacher/attendance/classes/[classId]/matrix/page")
);
const TeacherRequestsPage = lazy(() => import("./app/teacher/requests/page"));
const SelectRequestTypePage = lazy(
  () => import("./app/teacher/requests/create/select-type/page")
);
const SelectSessionPage = lazy(
  () => import("./app/teacher/requests/create/select-session/page")
);
const SelectResourcePage = lazy(
  () => import("./app/teacher/requests/create/select-resource/page")
);
const RequestFormPage = lazy(
  () => import("./app/teacher/requests/create/form/page")
);
const RequestDetailPage = lazy(
  () => import("./app/teacher/requests/[id]/page")
);
const TeacherGradesListPage = lazy(() => import("./app/teacher/grades/page"));
const TeacherGradesPage = lazy(
  () => import("./app/teacher/classes/[classId]/grades/page")
);
const AssessmentScoresPage = lazy(
  () => import("./app/teacher/assessments/[assessmentId]/scores/page")
);
const TeacherStudentsPage = lazy(() => import("./app/teacher/students/page"));
const TeacherProfilePage = lazy(() => import("./app/teacher/profile/page"));

// Student pages
const StudentSchedulePage = lazy(() => import("./app/student/schedule/page"));
const StudentRequestsPage = lazy(() => import("./app/student/requests/page"));
const StudentAttendanceReportOverviewPage = lazy(
  () => import("./app/student/attendance-report/page")
);
const StudentClassAttendanceDetailPage = lazy(
  () => import("./app/student/attendance-report/[classId]/page")
);
const StudentMyClassesPage = lazy(
  () => import("./app/student/my-classes/page")
);
const StudentClassDetailPage = lazy(
  () => import("./app/student/my-classes/[classId]/page")
);
const StudentProfilePage = lazy(() => import("./app/student/profile/page"));
const StudentTranscriptPage = lazy(
  () => import("./app/student/transcript/page")
);
const StudentPendingFeedbackPage = lazy(
  () => import("./app/student/feedbacks/page")
);

// Academic pages
const AcademicClassesPage = lazy(() => import("./app/academic/classes/page"));
const AcademicClassDetailPage = lazy(
  () => import("./app/academic/classes/[id]/page")
);
const AcademicSessionDetailPage = lazy(
  () => import("./app/academic/sessions/[id]/page")
);
const AcademicStudentRequestsPage = lazy(
  () => import("./app/academic/student-requests/page")
);
const AcademicTeacherRequestsPage = lazy(
  () => import("./app/academic/teacher-requests/page")
);
const AcademicSelectTeacherPage = lazy(
  () => import("./app/academic/teacher-requests/create/select-teacher/page")
);
const AcademicSelectRequestTypePage = lazy(
  () => import("./app/academic/teacher-requests/create/select-type/page")
);
const AcademicSelectSessionPage = lazy(
  () => import("./app/academic/teacher-requests/create/select-session/page")
);
const AcademicCreateRequestFormPage = lazy(
  () => import("./app/academic/teacher-requests/create/form/page")
);
const AcademicStudentsPage = lazy(() => import("./app/academic/students/page"));
const AcademicTeachersPage = lazy(() => import("./app/academic/teachers/page"));
const CreateClassPage = lazy(
  () => import("./app/academic/classes/create/page")
);
const EditClassPage = lazy(
  () => import("./app/academic/classes/[id]/edit/page")
);

// Center Head pages
const CenterHeadDashboardPage = lazy(
  () => import("./app/center-head/dashboard/page")
);
const CenterHeadClassesPage = lazy(
  () => import("./app/center-head/classes/page")
);
const CenterHeadApprovalsPage = lazy(
  () => import("./app/center-head/approvals/page")
);
const CenterHeadTeacherSchedulesPage = lazy(
  () => import("./app/center-head/teacher-schedules/page")
);
const CenterHeadTeacherScheduleDetailPage = lazy(
  () => import("./app/center-head/teacher-schedules/[id]/page")
);
const CenterHeadResourcesPage = lazy(
  () => import("./app/center-head/resources/page")
);
const CenterHeadTimeSlotsPage = lazy(
  () => import("./app/center-head/timeslots/page")
);
const CenterHeadCurriculumPage = lazy(
  () => import("./app/center-head/curriculum/page")
);
const CenterHeadFeedbacksPage = lazy(
  () => import("./app/center-head/feedbacks/page")
);
const CenterHeadQAReportsPage = lazy(
  () => import("./app/center-head/qa-reports/page")
);
const ResourceDetailPage = lazy(
  () => import("./app/center-head/resources/[id]/page")
);
const TimeSlotDetailPage = lazy(
  () => import("./app/center-head/timeslots/[id]/page")
);

// Manager pages
const ManagerBranchesPage = lazy(() => import("./app/manager/branches/page"));
const ManagerProfilePage = lazy(() => import("./app/manager/profile/page"));
const ManagerBranchDetailPage = lazy(
  () => import("./app/manager/branches/[id]/page")
);
const ManagerTeachersPage = lazy(() => import("./app/manager/teachers/page"));
const ManagerTeacherDetailPage = lazy(
  () => import("./app/manager/teachers/[id]/page")
);
const ManagerClassesPage = lazy(() => import("./app/manager/classes/page"));
const ManagerResourcesPage = lazy(() => import("./app/manager/resources/page"));
const ManagerTimeSlotsPage = lazy(() => import("./app/manager/timeslots/page"));
const ManagerStudentFeedbackPage = lazy(
  () => import("./app/manager/student-feedback/page")
);
const ManagerPoliciesPage = lazy(() => import("./app/manager/policies/page"));

// Curriculum pages
// const CurriculumPage = lazy(() => import("./app/curriculum/page"));
const CurriculumsPage = lazy(() => import("./app/curriculum/curriculums/page"));
const CurriculumLevelsPage = lazy(() => import("./app/curriculum/levels/page"));
const CurriculumSubjectsPage = lazy(
  () => import("./app/curriculum/subjects/page")
);
const CurriculumCourseDetailPage = lazy(
  () => import("./app/curriculum/courses/[id]/page")
);
const SubjectDetailPage = lazy(
  () => import("./app/curriculum/subjects/[id]/page")
);
const CourseLearningPage = lazy(
  () => import("./app/curriculum/courses/learn/page")
);
const EditCoursePage = lazy(() => import("./app/curriculum/courses/edit/page"));
const CreateCoursePage = lazy(
  () => import("./app/curriculum/courses/create/page")
);
const LevelDetailPage = lazy(() => import("./app/curriculum/levels/[id]/page"));

// QA pages
const QARootPage = lazy(() => import("./app/qa/page"));
const QADashboardPage = lazy(() => import("./app/qa/dashboard/page"));
const QAClassesPage = lazy(() => import("./app/qa/classes/page"));
const QAClassDetailPage = lazy(() => import("./app/qa/classes/[id]/page"));
const QASessionDetailPage = lazy(() => import("./app/qa/sessions/[id]/page"));
const QAReportsPage = lazy(() => import("./app/qa/reports/page"));
const QAReportCreatePage = lazy(() => import("./app/qa/reports/create/page"));
const QAReportDetailPage = lazy(() => import("./app/qa/reports/[id]/page"));
const QAReportEditPage = lazy(() => import("./app/qa/reports/[id]/edit/page"));
const QAStudentFeedbackPage = lazy(
  () => import("./app/qa/student-feedback/page")
);

// Role-specific profile pages
const QAProfilePage = lazy(() => import("./app/qa/profile/page"));
const CenterHeadProfilePage = lazy(() => import("./app/center-head/profile/page"));
const AcademicProfilePage = lazy(() => import("./app/academic/profile/page"));

function App() {
  return (
    <BrowserRouter>
      <ApiSetup>
        <AuthProvider>
          <NavigationGuardProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route
                  path="/courses/:id"
                  element={<PublicCourseDetailPage />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Per-role dashboard */}
                <Route
                  path="/:role/dashboard"
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

                {/* Manager routes */}
                <Route
                  path="/manager/branches"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerBranchesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/teachers"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerTeachersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/classes"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerClassesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/timeslots"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerTimeSlotsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/resources"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerResourcesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/teachers/:id"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerTeacherDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/branches/:id"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerBranchDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/student-feedback"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerStudentFeedbackPage />
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
                <Route
                  path="/admin/dashboard-stats"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN"]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/policies"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerPoliciesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/centers"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN"]}>
                      <AdminCentersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN"]}>
                      <AdminAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/subjects"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN"]}>
                      <AdminSubjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <ProtectedRoute requiredRoles={["ADMIN"]}>
                      <AdminProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/profile"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER"]}>
                      <ManagerProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/profile"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/profile"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/profile"
                  element={
                    <ProtectedRoute requiredRoles={["ACADEMIC_AFFAIR"]}>
                      <AcademicProfilePage />
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
                  path="/teacher/classes/:classId/students"
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
                      <TeacherClassStudentsRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/classes/:classId"
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
                      <TeacherClassDetailPage />
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
                  path="/student/attendance-report/:classId"
                  element={
                    <ProtectedRoute requiredRoles={["STUDENT"]}>
                      <StudentClassAttendanceDetailPage />
                    </ProtectedRoute>
                  }
                />
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
                  path="/student/feedbacks"
                  element={
                    <ProtectedRoute requiredRoles={["STUDENT"]}>
                      <StudentPendingFeedbackPage />
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
                        "SUBJECT_LEADER",
                      ]}
                    >
                      <AcademicClassesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/classes/create"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "CENTER_HEAD",
                      ]}
                    >
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
                        "SUBJECT_LEADER",
                      ]}
                    >
                      <AcademicClassDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/sessions/:id"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                        "SUBJECT_LEADER",
                      ]}
                    >
                      <AcademicSessionDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/classes/:id/edit"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "CENTER_HEAD",
                      ]}
                    >
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
                        "SUBJECT_LEADER",
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
                        "SUBJECT_LEADER",
                      ]}
                    >
                      <AcademicTeacherRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/teacher-requests/create/select-teacher"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                      ]}
                    >
                      <AcademicSelectTeacherPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/teacher-requests/create/select-type"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                      ]}
                    >
                      <AcademicSelectRequestTypePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/teacher-requests/create/select-session"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                      ]}
                    >
                      <AcademicSelectSessionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/teacher-requests/create/form"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                      ]}
                    >
                      <AcademicCreateRequestFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/students"
                  element={
                    <ProtectedRoute
                      requiredRoles={[
                        "ACADEMIC_AFFAIR",
                        "ADMIN",
                        "MANAGER",
                        "CENTER_HEAD",
                        "SUBJECT_LEADER",
                      ]}
                    >
                      <AcademicStudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic/teachers"
                  element={
                    <ProtectedRoute
                      requiredRoles={["ACADEMIC_AFFAIR", "ADMIN"]}
                    >
                      <AcademicTeachersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum"
                  element={<Navigate to="/curriculum/curriculums" replace />}
                />

                {/* Curriculum routes */}
                <Route
                  path="/curriculum"
                  element={<Navigate to="/curriculum/curriculums" replace />}
                />
                <Route
                  path="/curriculum/curriculums"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <CurriculumsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/levels"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <CurriculumLevelsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/subjects"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <CurriculumSubjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/approvals"
                  element={
                    <ProtectedRoute requiredRoles={["MANAGER", "ADMIN"]}>
                      <CourseApprovalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/courses/create"
                  element={
                    <ProtectedRoute requiredRoles={["SUBJECT_LEADER"]}>
                      <CreateCoursePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/curriculum/subjects/:id"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <SubjectDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/curriculum/levels/:id"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <LevelDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/curriculum/courses/:id"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <CurriculumCourseDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/courses/:id/edit"
                  element={
                    <ProtectedRoute requiredRoles={["SUBJECT_LEADER"]}>
                      <EditCoursePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/curriculum/courses/:id/learn"
                  element={
                    <ProtectedRoute
                      requiredRoles={["SUBJECT_LEADER", "MANAGER", "ADMIN"]}
                    >
                      <CourseLearningPage />
                    </ProtectedRoute>
                  }
                />

                {/* Center Head */}
                <Route
                  path="/center-head/dashboard"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/classes"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadClassesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/approvals"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/teacher-schedules"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadTeacherSchedulesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/teacher-schedules/:id"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadTeacherScheduleDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/resources"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadResourcesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/resources/:id"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <ResourceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/timeslots"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadTimeSlotsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/timeslots/:id"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <TimeSlotDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/curriculum"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadCurriculumPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/feedbacks"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadFeedbacksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/center-head/qa-reports"
                  element={
                    <ProtectedRoute requiredRoles={["CENTER_HEAD"]}>
                      <CenterHeadQAReportsPage />
                    </ProtectedRoute>
                  }
                />

                {/* QA routes */}
                <Route
                  path="/qa"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QARootPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/dashboard"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QADashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/classes"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAClassesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/classes/:id"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAClassDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/sessions/:id"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QASessionDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/reports"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/reports/create"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAReportCreatePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/reports/:id"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAReportDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/reports/:id/edit"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAReportEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qa/student-feedback"
                  element={
                    <ProtectedRoute requiredRoles={["QA"]}>
                      <QAStudentFeedbackPage />
                    </ProtectedRoute>
                  }
                />

                {/* Root route - redirect based on auth state */}
                <Route path="/" element={<AuthRedirect />} />
                <Route path="/app" element={<AuthRedirect />} />

                {/* Catch all route - redirect based on auth state */}
                <Route path="*" element={<AuthRedirect />} />
              </Routes>
            </Suspense>
            <Toaster />
          </NavigationGuardProvider>
        </AuthProvider>
      </ApiSetup>
    </BrowserRouter>
  );
}

export default App;
