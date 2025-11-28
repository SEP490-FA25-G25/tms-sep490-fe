import * as React from "react";
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  FileTextIcon,
  GraduationCapIcon,
  HomeIcon,
  UsersIcon,
  HelpCircleIcon,
  BuildingIcon,
  AwardIcon,
  ClipboardCheckIcon,
  NotebookPenIcon,
  SchoolIcon,
  UserCircleIcon,
  PlusIcon,
  MessageCircleIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/hooks/useRoleBasedAccess";
import { Bell } from "lucide-react";

// Role-based navigation configuration
const roleBasedNav = {
  [ROLES.ADMIN]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/dashboard",
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
        title: "Quản lý trung tâm",
        url: "/admin/centers",
        icon: BuildingIcon,
      },
      {
        title: "Quản lý môn học",
        url: "/admin/subjects",
        icon: BookOpenIcon,
      },
    ],
  },
  [ROLES.MANAGER]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Phê duyệt khóa học",
        url: "/manager/courses/approve",
        icon: CheckCircleIcon,
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
        url: "/dashboard",
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
        title: "Quản lý học sinh",
        url: "/center/students",
        icon: UsersIcon,
      },
      {
        title: "Phân công giáo viên",
        url: "/center/teachers",
        icon: GraduationCapIcon,
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
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Quản lý môn học",
        url: "/curriculum",
        icon: BookOpenIcon,
      },
      {
        title: "Phân công giáo viên",
        url: "/subject/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Lập kế hoạch giảng dạy",
        url: "/subject/curriculum",
        icon: FileTextIcon,
      },
      {
        title: "Theo dõi kết quả",
        url: "/subject/performance",
        icon: BarChartIcon,
      },
    ],
  },
  [ROLES.TEACHER]: {
    navMain: [
      {
        title: "Bảng điều khiển",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Lớp học của tôi",
        url: "/teacher/classes",
        icon: SchoolIcon,
      },
      {
        title: "Lịch dạy",
        url: "/teacher/schedule",
        icon: CalendarIcon,
      },
      {
        title: "Điểm danh",
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
        title: "Bảng điều khiển",
        url: "/dashboard",
        icon: HomeIcon,
      },
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
        title: "Tạo báo cáo QA",
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
        url: "/dashboard",
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
        title: "Hỗ trợ học thuật",
        url: "/academic/support",
        icon: HelpCircleIcon,
      },
      {
        title: "Tài liệu",
        url: "/academic/docs",
        icon: FileTextIcon,
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
    ],
  },
};

const navSecondary = [
  {
    title: "Thông báo",
    url: "#",
    icon: Bell,
    component: <NotificationBell />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Get navigation items based on user's highest priority role
  const getHighestRole = () => {
    if (!user?.roles || user.roles.length === 0) {
      return undefined;
    }

    // Find highest priority role
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

    return user.roles.reduce((highest, current) =>
      rolePriorities[current as keyof typeof rolePriorities] >
        rolePriorities[highest as keyof typeof rolePriorities]
        ? current
        : highest
    );
  };

  const highestRole = getHighestRole();
  const navMain = highestRole ? roleBasedNav[highestRole as keyof typeof roleBasedNav]?.navMain || [] : [];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Training Management</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName || "Người dùng",
            email: user?.email || "",
            avatar: "/avatars/default.jpg",
            role: highestRole,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
