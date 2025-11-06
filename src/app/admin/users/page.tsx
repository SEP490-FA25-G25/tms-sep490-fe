import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminRoute } from '@/components/ProtectedRoute'

export default function AdminUsersPage() {
  return (
    <AdminRoute>
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
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h1>
                    <p className="text-muted-foreground">
                      Quản lý người dùng, vai trò và quyền hạn trong hệ thống
                    </p>
                  </div>
                </div>

                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tất cả Người dùng</CardTitle>
                      <CardDescription>
                        Xem và quản lý tất cả người dùng đã đăng ký trong hệ thống
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Giao diện quản lý người dùng sẽ được triển khai tại đây với các tính năng:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Danh sách người dùng với tìm kiếm và bộ lọc</li>
                          <li>Tạo người dùng mới</li>
                          <li>Chỉnh sửa hồ sơ và vai trò người dùng</li>
                          <li>Vô hiệu hóa/kích hoạt tài khoản người dùng</li>
                          <li>Phân công vai trò và quản lý quyền hạn</li>
                          <li>Nhật ký hoạt động và dấu vết kiểm tra của người dùng</li>
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
    </AdminRoute>
  )
}