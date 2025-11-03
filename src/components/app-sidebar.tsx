import * as React from "react"
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
  SettingsIcon,
  SearchIcon,
  HelpCircleIcon,
  BuildingIcon,
  AwardIcon,
  ClipboardCheckIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { ROLES } from "@/hooks/useRoleBasedAccess"

// Role-based navigation configuration
const roleBasedNav = {
  [ROLES.ADMIN]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "User Management",
        url: "/admin/users",
        icon: UsersIcon,
      },
      {
        title: "System Analytics",
        url: "/admin/analytics",
        icon: BarChartIcon,
      },
      {
        title: "Center Management",
        url: "/admin/centers",
        icon: BuildingIcon,
      },
      {
        title: "Subject Management",
        url: "/admin/subjects",
        icon: BookOpenIcon,
      },
    ],
  },
  [ROLES.MANAGER]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Course Approval",
        url: "/manager/courses/approve",
        icon: CheckCircleIcon,
      },
      {
        title: "Teacher Management",
        url: "/manager/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Reports",
        url: "/manager/reports",
        icon: FileTextIcon,
      },
      {
        title: "Analytics",
        url: "/manager/analytics",
        icon: BarChartIcon,
      },
    ],
  },
  [ROLES.CENTER_HEAD]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Class Management",
        url: "/center/classes",
        icon: CalendarIcon,
      },
      {
        title: "Student Management",
        url: "/center/students",
        icon: UsersIcon,
      },
      {
        title: "Teacher Assignment",
        url: "/center/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Center Reports",
        url: "/center/reports",
        icon: FileTextIcon,
      },
    ],
  },
  [ROLES.SUBJECT_LEADER]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Subject Management",
        url: "/subject/courses",
        icon: BookOpenIcon,
      },
      {
        title: "Teacher Assignment",
        url: "/subject/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Curriculum Planning",
        url: "/subject/curriculum",
        icon: FileTextIcon,
      },
      {
        title: "Performance Tracking",
        url: "/subject/performance",
        icon: BarChartIcon,
      },
    ],
  },
  [ROLES.TEACHER]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "My Classes",
        url: "/teacher/classes",
        icon: CalendarIcon,
      },
      {
        title: "Assignments",
        url: "/teacher/assignments",
        icon: FileTextIcon,
      },
      {
        title: "Grade Management",
        url: "/teacher/grades",
        icon: AwardIcon,
      },
      {
        title: "Student Progress",
        url: "/teacher/students",
        icon: UsersIcon,
      },
    ],
  },
  [ROLES.STUDENT]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "My Courses",
        url: "/student/courses",
        icon: BookOpenIcon,
      },
      {
        title: "Assignments",
        url: "/student/assignments",
        icon: FileTextIcon,
      },
      {
        title: "Grades",
        url: "/student/grades",
        icon: AwardIcon,
      },
      {
        title: "Schedule",
        url: "/student/schedule",
        icon: CalendarIcon,
      },
    ],
  },
  [ROLES.QA]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Quality Audits",
        url: "/qa/audits",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Course Review",
        url: "/qa/courses",
        icon: BookOpenIcon,
      },
      {
        title: "Teacher Evaluation",
        url: "/qa/teachers",
        icon: GraduationCapIcon,
      },
      {
        title: "Reports",
        url: "/qa/reports",
        icon: FileTextIcon,
      },
    ],
  },
  [ROLES.ACADEMIC_AFFAIR]: {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
      },
      {
        title: "Class Management",
        url: "/academic/classes",
        icon: CalendarIcon,
      },
      {
        title: "Student Records",
        url: "/academic/students",
        icon: UsersIcon,
      },
      {
        title: "Academic Support",
        url: "/academic/support",
        icon: HelpCircleIcon,
      },
      {
        title: "Documentation",
        url: "/academic/docs",
        icon: FileTextIcon,
      },
    ],
  },
}

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
  {
    title: "Get Help",
    url: "/help",
    icon: HelpCircleIcon,
  },
  {
    title: "Search",
    url: "/search",
    icon: SearchIcon,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Get navigation items based on user's highest priority role
  const getNavigationForRole = () => {
    if (!user?.roles || user.roles.length === 0) {
      return { navMain: [] }
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
    }

    const highestRole = user.roles.reduce((highest, current) =>
      rolePriorities[current as keyof typeof rolePriorities] >
      rolePriorities[highest as keyof typeof rolePriorities] ? current : highest
    )

    return roleBasedNav[highestRole as keyof typeof roleBasedNav] || { navMain: [] }
  }

  const { navMain } = getNavigationForRole()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">TMS</span>
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
        <NavUser user={{
          name: user?.fullName || 'User',
          email: user?.email || '',
          avatar: '/avatars/default.jpg',
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
