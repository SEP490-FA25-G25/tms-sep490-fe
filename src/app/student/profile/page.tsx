'use client';

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetMyProfileQuery } from '@/store/services/studentProfileApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Phone,
  MapPin,
  AlertCircle,
  FileText,
  User,
  Mail,
  Facebook,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentProfilePage() {
  const { data: profile, error, isLoading } = useGetMyProfileQuery();
  const navigate = useNavigate();

  if (isLoading) {
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
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Đang tải thông tin hồ sơ...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </StudentRoute>
    );
  }

  if (error || !profile) {
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
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="text-center max-w-md">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <p className="text-base font-semibold mb-2">Không thể tải thông tin hồ sơ</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Vui lòng thử lại sau hoặc liên hệ hỗ trợ
                </p>
                <Button size="sm" onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </StudentRoute>
    );
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="@container/main py-6 md:py-8">
          <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-8">
            {/* Row 1: Title + Actions */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={
                    profile.status === 'ACTIVE'
                      ? 'bg-success/10 text-success border-success/20'
                      : profile.status === 'SUSPENDED'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground border-muted-foreground/20'
                  }>
                    {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                  </Badge>
                  <Badge variant="secondary">{profile.studentCode}</Badge>
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    {profile.fullName}
                  </h1>
                  <p className="text-lg text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.branchName}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button>Chỉnh sửa thông tin</Button>
                <Button variant="ghost">Đổi mật khẩu</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-6">

          {/* Personal Info Section */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Mã sinh viên</span>
                </div>
                <p className="text-base text-foreground">{profile.studentCode}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Họ tên</span>
                </div>
                <p className="text-base text-foreground">{profile.fullName}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="text-base text-foreground">{profile.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Số điện thoại</span>
                </div>
                <p className="text-base text-foreground">{profile.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Giới tính</span>
                </div>
                <p className="text-base text-foreground">
                  {profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày sinh</span>
                </div>
                <p className="text-base text-foreground">
                  {profile.dateOfBirth ?
                    new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') :
                    'Chưa cập nhật'
                  }
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Địa chỉ</span>
                </div>
                <p className="text-base text-foreground">{profile.address || 'Chưa cập nhật'}</p>
              </div>
              {profile.facebookUrl && (
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </div>
                  <p className="text-base text-foreground">{profile.facebookUrl}</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Classes Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-semibold">Lớp đang học</h2>
              <span className="text-sm text-muted-foreground">
                {profile.currentClasses.length} lớp
              </span>
            </div>

            {profile.currentClasses.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Bạn chưa đăng ký lớp học nào đang hoạt động.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã lớp</TableHead>
                      <TableHead>Tên lớp</TableHead>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.currentClasses.map((cls) => (
                      <TableRow
                        key={cls.classId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/student/classes/${cls.classId}`)}
                      >
                        <TableCell className="font-medium">{cls.classCode}</TableCell>
                        <TableCell>{cls.className}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cls.courseCode}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-success/10 text-success border-success/20">
                            {cls.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
}

