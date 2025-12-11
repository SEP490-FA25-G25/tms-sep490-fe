import * as React from "react";
import { BranchSelector } from "@/components/BranchSelector";
import {
  BarChartIcon,
  BookOpenIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  FileTextIcon,
  GraduationCapIcon,
  HomeIcon,
  UsersIcon,
  BuildingIcon,
  AwardIcon,
  ClipboardCheckIcon,
  NotebookPenIcon,
  SchoolIcon,
  SlidersHorizontalIcon,
  PlusIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  LogOutIcon,
  Clock,
  BellIcon,
  LayersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { StudentFeedbackNavBadge } from "@/components/student-feedback/StudentFeedbackBadge";
import {
  StudentRequestsBadge,
  TeacherRequestsBadge,
} from "@/components/academic/AcademicRequestsBadge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/hooks/useRoleBasedAccess";
import { Link, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const roleLabelMap: Record<string, string> = {
  [ROLES.ADMIN]: "Quản trị hệ thống",
  [ROLES.MANAGER]: "Quản lý vùng",
  [ROLES.CENTER_HEAD]: "Trưởng trung tâm",
  [ROLES.SUBJECT_LEADER]: "Trưởng bộ môn",
  [ROLES.ACADEMIC_AFFAIR]: "Học vụ",
  [ROLES.QA]: "Kiểm định chất lượng",
  [ROLES.TEACHER]: "Giáo viên",
  [ROLES.STUDENT]: "Học viên",
};

// Role-based navigation configuration
const roleBasedNav = {
  [ROLES.ADMIN]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/admin/dashboard-stats",
        icon: HomeIcon,
      },
      {
        title: "Quản lý tài khoản người dùng",
        url: "/admin/users",
        icon: UsersIcon,
      },
    ],
  },
  [ROLES.MANAGER]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/manager/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Quản lý chi nhánh",
        url: "/manager/branches",
        icon: BuildingIcon,
      },
      {
        title: "Quản lý lớp học",
        url: "/manager/classes",
        icon: CalendarIcon,
      },
      {
        title: "Quản lý yêu cầu phê duyệt khóa học",
        url: "/curriculum/approvals",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Khung chương trình",
        url: "/curriculum/curriculums",
        icon: BookOpenIcon,
      },
      {
        title: "Cấp độ",
        url: "/curriculum/levels",
        icon: LayersIcon,
      },
      {
        title: "Môn học",
        url: "/curriculum/subjects",
        icon: FileTextIcon,
      },
      {
        title: "Quản lý giáo viên",
        url: "/manager/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Quản lý tài nguyên",
        url: "/manager/resources",
        icon: BuildingIcon,
      },
      {
        title: "Quản lý khung giờ học",
        url: "/manager/timeslots",
        icon: Clock,
      },
      {
        title: "Chính sách hệ thống",
        url: "/manager/policies",
        icon: SlidersHorizontalIcon,
      },
      {
        title: "Danh sách phản hồi từ học viên",
        url: "/manager/student-feedback",
        icon: MessageCircleIcon,
      },
      {
        title: "Báo cáo",
        url: "/manager/reports",
        icon: FileTextIcon,
      },
      {
        title: "Thông báo",
        url: "/notifications",
        icon: BellIcon,
      },
    ],
  },
  [ROLES.CENTER_HEAD]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/center-head/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Danh sách lớp học",
        url: "/center-head/classes",
        icon: CalendarIcon,
      },
      {
        title: "Phê duyệt lớp học",
        url: "/center-head/approvals",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Lịch dạy giáo viên",
        url: "/center-head/teacher-schedules",
        icon: CalendarIcon,
      },
      {
        title: "Quản lý tài nguyên",
        url: "/center-head/resources",
        icon: BuildingIcon,
      },
      {
        title: "Quản lý khung giờ học",
        url: "/center-head/timeslots",
        icon: Clock,
      },
      {
        title: "Chương trình đào tạo",
        url: "/center-head/curriculum",
        icon: BookIcon,
      },
      {
        title: "Phản hồi học viên",
        url: "/center-head/feedbacks",
        icon: MessageSquareIcon,
      },
      {
        title: "Báo cáo QA",
        url: "/center-head/qa-reports",
        icon: FileTextIcon,
      },
    ],
  },
  [ROLES.SUBJECT_LEADER]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/subject_leader/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Khung chương trình",
        url: "/curriculum/curriculums",
        icon: BookOpenIcon,
      },
      {
        title: "Cấp độ",
        url: "/curriculum/levels",
        icon: LayersIcon,
      },
      {
        title: "Môn học",
        url: "/curriculum/subjects",
        icon: FileTextIcon,
      },
    ],
  },
  [ROLES.TEACHER]: {
    navMain: [
      {
        title: "Lịch dạy của tôi",
        url: "/teacher/schedule",
        icon: CalendarIcon,
      },
      {
        title: "Lớp học của tôi",
        url: "/teacher/classes",
        icon: SchoolIcon,
      },
      {
        title: "Đăng ký lịch giảng dạy",
        url: "/teacher/availability",
        icon: CalendarIcon,
      },
      {
        title: "Điểm danh buổi học",
        url: "/teacher/attendance",
        icon: CheckCircleIcon,
      },
      {
        title: "Yêu cầu của tôi",
        url: "/teacher/requests",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Quản lý điểm",
        url: "/teacher/grades",
        icon: AwardIcon,
      },
    ],
  },
  [ROLES.STUDENT]: {
    navMain: [
      {
        title: "Thời khóa biểu",
        url: "/student/schedule",
        icon: CalendarIcon,
      },
      {
        title: "Lớp của tôi",
        url: "/student/my-classes",
        icon: SchoolIcon,
      },
      {
        title: "Báo cáo điểm danh",
        url: "/student/attendance-report",
        icon: BarChartIcon,
      },
      {
        title: "Bảng điểm",
        url: "/student/transcript",
        icon: GraduationCapIcon,
      },
      {
        title: "Yêu cầu của tôi",
        url: "/student/requests",
        icon: NotebookPenIcon,
      },
      {
        title: "Phản hồi khóa học",
        url: "/student/feedbacks",
        icon: MessageCircleIcon,
        badge: <StudentFeedbackNavBadge />,
      },
    ],
  },
  [ROLES.QA]: {
    navMain: [
      {
        title: "Danh sách lớp học",
        url: "/qa/classes",
        icon: SchoolIcon,
      },
      {
        title: "Tạo báo cáo",
        url: "/qa/reports/create",
        icon: PlusIcon,
      },
      {
        title: "Danh sách báo cáo",
        url: "/qa/reports",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Phản Hồi Học Viên",
        url: "/qa/student-feedback",
        icon: MessageCircleIcon,
      },
    ],
  },
  [ROLES.ACADEMIC_AFFAIR]: {
    navMain: [
      {
        title: "Quản lý lớp học",
        url: "/academic/classes",
        icon: CalendarIcon,
      },
      {
        title: "Hồ sơ học sinh",
        url: "/academic/students",
        icon: UsersIcon,
      },
      {
        title: "Quản lý giáo viên",
        url: "/academic/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Quản lý yêu cầu học viên",
        url: "/academic/student-requests",
        icon: ClipboardCheckIcon,
        badge: <StudentRequestsBadge />,
      },
      {
        title: "Quản lý yêu cầu giáo viên",
        url: "/academic/teacher-requests",
        icon: ClipboardCheckIcon,
        badge: <TeacherRequestsBadge />,
      },
      {
        title: "Quản lý đợt cập nhật lịch dạy",
        url: "/academic/teacher-availability",
        icon: CalendarIcon,
      },
    ],
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, branches, selectedBranchId, selectBranch } = useAuth();
  const navigate = useNavigate();

  const isAcademicAffair =
    user?.roles?.includes(ROLES.ACADEMIC_AFFAIR) ?? false;
  const isCenterHead = user?.roles?.includes(ROLES.CENTER_HEAD) ?? false;
  const isQA = user?.roles?.includes(ROLES.QA) ?? false;
  const showBranchSelector =
    (isAcademicAffair || isCenterHead || isQA) && branches.length > 1;

  const rolePriorities = {
    [ROLES.ADMIN]: 8,
    [ROLES.MANAGER]: 7,
    [ROLES.CENTER_HEAD]: 6,
    [ROLES.SUBJECT_LEADER]: 5,
    [ROLES.ACADEMIC_AFFAIR]: 4,
    [ROLES.QA]: 3,
    [ROLES.TEACHER]: 2,
    [ROLES.STUDENT]: 1,
  };

  const orderedRoles =
    user?.roles
      ?.filter((role) => roleBasedNav[role as keyof typeof roleBasedNav])
      .sort(
        (a, b) =>
          (rolePriorities[b as keyof typeof rolePriorities] ?? 0) -
          (rolePriorities[a as keyof typeof rolePriorities] ?? 0)
      ) ?? [];

  const navSections = orderedRoles.map((role) => ({
    role,
    label: roleLabelMap[role] ?? role,
    items: roleBasedNav[role as keyof typeof roleBasedNav]?.navMain ?? [],
  }));

  const brandHref = "/";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 data-[slot=sidebar-menu-button]:!justify-start data-[slot=sidebar-menu-button]:!h-auto"
            >
              <Link to={brandHref} className="flex items-center gap-2">
                <img
                  src="/Logo_TMS.png"
                  alt="TMS Logo"
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
                <span
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    lineHeight: 1.05,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "rgba(57, 121, 65, 1)",
                      fontSize: "1rem",
                    }}
                  >
                    TMS
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#5c6a7c",
                      fontSize: "0.75rem",
                      marginTop: "2px",
                    }}
                  >
                    Training Management System
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-4">
        {showBranchSelector && (
          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={selectBranch}
          />
        )}
        {navSections.length > 1 ? (
          <Accordion
            type="multiple"
            defaultValue={navSections.map((section) => section.role)}
            className="w-full space-y-1"
          >
            {navSections.map((section) => (
              <AccordionItem
                value={section.role}
                key={section.role}
                className="border-border/40 rounded-md border px-2"
              >
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-wide">
                  {section.label}
                </AccordionTrigger>
                <AccordionContent>
                  <NavMain items={section.items} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <NavMain items={navSections[0]?.items ?? []} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton>
                  <LogOutIcon className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Đăng xuất
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
