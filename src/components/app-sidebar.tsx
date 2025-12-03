import * as React from "react";
import {
  BarChartIcon,
  BookOpenIcon,
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
  UserCircleIcon,
  SlidersHorizontalIcon,
  PlusIcon,
  MessageCircleIcon,
  LogOutIcon,
  Clock,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { StudentFeedbackNavBadge } from "@/components/student-feedback/StudentFeedbackBadge";
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
        url: "/admin/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Quản lý người dùng",
        url: "/admin/users",
        icon: UsersIcon,
      },
      {
        title: "Phân tích hệ thống",
        url: "/admin/analytics",
        icon: BarChartIcon,
      },
      {
        title: "Quản lý trung tâm và chi nhánh",
        url: "/admin/centers",
        icon: BuildingIcon,
      },
      {
        title: "Quản lý chương trình đào tạo",
        url: "/admin/subjects",
        icon: BookOpenIcon,
      },
      {
        title: "Chính sách hệ thống",
        url: "/admin/policies",
        icon: SlidersHorizontalIcon,
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
        title: "Quản lý chương trình đào tạo",
        url: "/curriculum",
        icon: BookOpenIcon,
      },
      {
        title: "Quản lý giáo viên",
        url: "/manager/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Báo cáo",
        url: "/manager/reports",
        icon: FileTextIcon,
      },
      {
        title: "Phân tích",
        url: "/manager/analytics",
        icon: BarChartIcon,
      },
    ],
  },
  [ROLES.CENTER_HEAD]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/center_head/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Quản lý lớp học",
        url: "/center/classes",
        icon: CalendarIcon,
      },
      {
        title: "Phê duyệt lớp học",
        url: "/center-head/approvals",
        icon: ClipboardCheckIcon,
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
        title: "Quản lý học sinh",
        url: "/center/students",
        icon: UsersIcon,
      },
      {
        title: "Báo cáo trung tâm",
        url: "/center/reports",
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
        title: "Quản lý chương trình đào tạo",
        url: "/curriculum",
        icon: BookOpenIcon,
      },
    ],
  },
  [ROLES.TEACHER]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/teacher/dashboard",
        icon: HomeIcon,
      },
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
      {
        title: "Hồ sơ cá nhân",
        url: "/teacher/profile",
        icon: UserCircleIcon,
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
      {
        title: "Hồ sơ cá nhân",
        url: "/student/profile",
        icon: UserCircleIcon,
      },
    ],
  },
  [ROLES.QA]: {
    navMain: [
      {
        title: "Tổng quan QA",
        url: "/qa/dashboard",
        icon: BarChartIcon,
      },
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
        title: "Bảng điều khiển",
        url: "/academic_affair/dashboard",
        icon: HomeIcon,
      },
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
        title: "Quản lý yêu cầu học viên",
        url: "/academic/student-requests",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Quản lý yêu cầu giáo viên",
        url: "/academic/teacher-requests",
        icon: ClipboardCheckIcon,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const brandHref = navSections[0]?.items?.[0]?.url ?? "/login";

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
              className="data-[slot=sidebar-menu-button]:!p-1 data-[slot=sidebar-menu-button]:!justify-start"
            >
              <Link to={brandHref} className="flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="Anh ngữ Pinnacle Logo"
                  className="h-8 w-auto"
                />
                <span className="text-base font-semibold">
                  Anh ngữ Pinnacle
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-4">
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
