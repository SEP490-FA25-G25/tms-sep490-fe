import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeacherRoute } from '@/components/ProtectedRoute'

export default function TeacherClassesPage() {
  return (
    <TeacherRoute>
      <SidebarProvider
        style={{
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Lớp học của tôi</h1>
                    <p className="text-muted-foreground">
                      Quản lý lịch trình lớp học, học sinh và tài liệu khóa học
                    </p>
                  </div>
                </div>

                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lịch trình lớp học</CardTitle>
                      <CardDescription>
                        Xem và quản lý lịch dạy và phân công lớp học của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Giao diện quản lý lớp học của giáo viên sẽ bao gồm:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Xem lịch trình lớp học hàng tuần/tháng</li>
                          <li>Quản lý danh sách lớp và học sinh</li>
                          <li>Theo dõi và báo cáo điểm danh</li>
                          <li>Tạo và chấm điểm bài tập</li>
                          <li>Tải lên và chia sẻ tài liệu khóa học</li>
                          <li>Giao tiếp với học sinh và phụ huynh</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherRoute>
  )
}