import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/hooks/useRoleBasedAccess'
import { AdminDashboardContent } from '@/components/dashboard/role-based/AdminDashboardContent'
import { ManagerDashboardContent } from '@/components/dashboard/role-based/ManagerDashboardContent'
import { TeacherDashboardContent } from '@/components/dashboard/role-based/TeacherDashboardContent'
import { StudentDashboardContent } from '@/components/dashboard/role-based/StudentDashboardContent'
import { CenterHeadDashboardContent } from '@/components/dashboard/role-based/CenterHeadDashboardContent'
import { SubjectLeaderDashboardContent } from '@/components/dashboard/role-based/SubjectLeaderDashboardContent'
import { QADashboardContent } from '@/components/dashboard/role-based/QADashboardContent'
import { AcademicStaffDashboardContent } from '@/components/dashboard/role-based/AcademicStaffDashboardContent'
import { useParams } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const params = useParams()
  const roleParam = (params as { role?: string }).role

  const getDashboardContent = () => {
    if (!user?.roles || user.roles.length === 0) {
      return <div className="p-6">Không có nội dung dashboard cho vai trò của bạn.</div>
    }

    // Get highest priority role (fallback)
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

    // If URL specifies a role and user actually has it, use that role
    const normalizedParam = roleParam?.toUpperCase() as keyof typeof ROLES | undefined
    const effectiveRole =
      normalizedParam && user.roles.includes(normalizedParam)
        ? normalizedParam
        : (highestRole as keyof typeof ROLES)

    switch (effectiveRole) {
      case ROLES.ADMIN:
        return <AdminDashboardContent />
      case ROLES.MANAGER:
        return <ManagerDashboardContent />
      case ROLES.CENTER_HEAD:
        return <CenterHeadDashboardContent />
      case ROLES.SUBJECT_LEADER:
        return <SubjectLeaderDashboardContent />
      case ROLES.TEACHER:
        return <TeacherDashboardContent />
      case ROLES.STUDENT:
        return <StudentDashboardContent />
      case ROLES.QA:
        return <QADashboardContent />
      case ROLES.ACADEMIC_AFFAIR:
        return <AcademicStaffDashboardContent />
      default:
        return <div className="p-6">Không có nội dung dashboard cho vai trò của bạn.</div>
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Chào mừng trở lại, {user?.fullName || 'Người dùng'}!
                  </h1>
                  <p className="text-muted-foreground">
                    Đây là những gì đang diễn ra với tài khoản của bạn hôm nay.
                  </p>
                </div>
              </div>
              {getDashboardContent()}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
