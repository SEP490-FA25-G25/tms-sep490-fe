import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentRoute } from '@/components/ProtectedRoute'

export default function StudentCoursesPage() {
  return (
    <StudentRoute>
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
                    <h1 className="text-3xl font-bold tracking-tight">Khóa Học Của Tôi</h1>
                    <p className="text-muted-foreground">
                      Xem các khóa học đã đăng ký, bài tập và tiến độ học tập của bạn
                    </p>
                  </div>
                </div>

                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Các Khóa Học Đã Đăng Ký</CardTitle>
                      <CardDescription>
                        Truy cập tài liệu khóa học, bài tập và điểm số của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Cổng thông tin khóa học sinh viên sẽ cung cấp:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Danh sách khóa học với lịch học và giảng viên</li>
                          <li>Truy cập tài liệu khóa học và tài nguyên học tập</li>
                          <li>Cổng nộp bài tập</li>
                          <li>Theo dõi điểm số và tiến độ học tập</li>
                          <li>Lịch học và tích hợp lịch</li>
                          <li>Giao tiếp với giáo viên và bạn học</li>
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
    </StudentRoute>
  )
}