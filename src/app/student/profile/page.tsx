'use client';

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetMyProfileQuery } from '@/store/services/studentProfileApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
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
import { cn } from '@/lib/utils';
import { ENROLLMENT_STATUS_STYLES, USER_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors';
import { useMemo } from 'react';

export default function StudentProfilePage() {
  const { data: profile, error, isLoading } = useGetMyProfileQuery();
  const navigate = useNavigate();

  // Filter enrollments into two categories
  const currentClasses = useMemo(() =>
    profile?.enrollments.filter(e => e.enrollmentStatus === 'ENROLLED') || [],
    [profile]
  );

  const completedClasses = useMemo(() =>
    profile?.enrollments.filter(e => e.enrollmentStatus === 'COMPLETED') || [],
    [profile]
  );

  const getEnrollmentStatusText = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'Đang học';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'DROPPED':
        return 'Đã nghỉ';
      case 'WITHDRAWN':
        return 'Đã rút';
      default:
        return status;
    }
  };

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
            <div className="flex flex-1 flex-col">
              <div className="min-h-screen bg-background">
                {/* Header Skeleton */}
                <div className="border-b bg-background">
                  <div className="@container/main py-6 md:py-8">
                    <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-8">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-36" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Skeleton className="h-10 w-36" />
                          <Skeleton className="h-10 w-28" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Content Skeleton */}
                <div className="@container/main py-6 md:py-8">
                  <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-6">
                    <Card className="p-6">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-40" />
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Skeleton className="h-64 w-full" />
                  </div>
                </div>
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
              <div className="border-b bg-background">
                <div className="@container/main py-6 md:py-8">
                  <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-8">
                    {/* Row 1: Title + Actions */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={getStatusStyle(USER_STATUS_STYLES, profile.status)}>
                            {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                          </Badge>
                          <Badge variant="secondary">{profile.studentCode}</Badge>
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-3xl font-bold tracking-tight">
                            {profile.fullName}
                          </h1>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
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
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>
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
                  </Card>

                  {/* Current Classes Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Lớp đang học</h2>
                      <span className="text-sm text-muted-foreground">
                        {currentClasses.length} lớp
                      </span>
                    </div>

                    {currentClasses.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileText className="h-10 w-10" />
                          </EmptyMedia>
                          <EmptyTitle>Chưa có lớp học</EmptyTitle>
                          <EmptyDescription>
                            Bạn chưa đăng ký lớp học nào đang hoạt động.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <Card className="overflow-hidden p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-32">Mã lớp</TableHead>
                              <TableHead>Tên lớp</TableHead>
                              <TableHead className="w-48">Khóa học</TableHead>
                              <TableHead className="w-40">Chi nhánh</TableHead>
                              <TableHead className="w-32 text-center">Ngày ghi danh</TableHead>
                              <TableHead className="w-48 text-center">Thời gian học</TableHead>
                              <TableHead className="w-32 text-center">Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentClasses.map((cls) => (
                              <TableRow
                                key={cls.classId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/student/my-classes/${cls.classId}`)}
                              >
                                <TableCell className="font-medium">{cls.classCode}</TableCell>
                                <TableCell>{cls.className}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cls.courseName}
                                </TableCell>
                                <TableCell className="text-sm">{cls.branchName}</TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.enrolledAt).toLocaleDateString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.startDate).toLocaleDateString('vi-VN')} - {new Date(cls.plannedEndDate).toLocaleDateString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={cn('text-xs', getStatusStyle(ENROLLMENT_STATUS_STYLES, cls.enrollmentStatus))}>
                                    {getEnrollmentStatusText(cls.enrollmentStatus)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </div>

                  {/* Completed Classes Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Lịch sử lớp học</h2>
                      <span className="text-sm text-muted-foreground">
                        {completedClasses.length} lớp đã hoàn thành
                      </span>
                    </div>

                    {completedClasses.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileText className="h-10 w-10" />
                          </EmptyMedia>
                          <EmptyTitle>Chưa có lớp đã hoàn thành</EmptyTitle>
                          <EmptyDescription>
                            Bạn chưa hoàn thành lớp học nào.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <Card className="overflow-hidden p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-32">Mã lớp</TableHead>
                              <TableHead>Tên lớp</TableHead>
                              <TableHead className="w-48">Khóa học</TableHead>
                              <TableHead className="w-40">Chi nhánh</TableHead>
                              <TableHead className="w-32 text-center">Ngày ghi danh</TableHead>
                              <TableHead className="w-48 text-center">Thời gian học</TableHead>
                              <TableHead className="w-32 text-center">Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedClasses.map((cls) => (
                              <TableRow
                                key={cls.classId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/student/my-classes/${cls.classId}`)}
                              >
                                <TableCell className="font-medium">{cls.classCode}</TableCell>
                                <TableCell>{cls.className}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cls.courseName}
                                </TableCell>
                                <TableCell className="text-sm">{cls.branchName}</TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.enrolledAt).toLocaleDateString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.startDate).toLocaleDateString('vi-VN')} - {new Date(cls.plannedEndDate).toLocaleDateString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={cn('text-xs', getStatusStyle(ENROLLMENT_STATUS_STYLES, cls.enrollmentStatus))}>
                                    {getEnrollmentStatusText(cls.enrollmentStatus)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
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

