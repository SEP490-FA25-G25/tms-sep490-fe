"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { useGetMyProfileQuery } from "@/store/services/teacherProfileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  MapPin,
  AlertCircle,
  User,
  Mail,
  Facebook,
  Calendar,
  School,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";

export default function TeacherProfilePage() {
  const { data: profile, error, isLoading } = useGetMyProfileQuery();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Filter classes into two categories
  const currentClasses = useMemo(
    () =>
      profile?.classes.filter(
        (c) => c.status === "ONGOING" || c.status === "ACTIVE"
      ) || [],
    [profile]
  );

  const completedClasses = useMemo(
    () =>
      profile?.classes.filter(
        (c) => c.status === "COMPLETED" || c.status === "ENDED"
      ) || [],
    [profile]
  );

  const getClassStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING":
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLETED":
      case "ENDED":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PLANNED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getClassStatusText = (status: string) => {
    switch (status) {
      case "ONGOING":
      case "ACTIVE":
        return "Đang dạy";
      case "COMPLETED":
      case "ENDED":
        return "Đã hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      case "PLANNED":
        return "Kế hoạch";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <TeacherRoute>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Đang tải thông tin hồ sơ...
                </p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TeacherRoute>
    );
  }

  if (error || !profile) {
    return (
      <TeacherRoute>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="text-center max-w-md">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <p className="text-base font-semibold mb-2">
                  Không thể tải thông tin hồ sơ
                </p>
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
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
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
                          <Badge
                            className={
                              profile.status === "ACTIVE"
                                ? "bg-success/10 text-success border-success/20"
                                : profile.status === "SUSPENDED"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-muted text-muted-foreground border-muted-foreground/20"
                            }
                          >
                            {profile.status === "ACTIVE"
                              ? "Đang hoạt động"
                              : "Ngưng hoạt động"}
                          </Badge>
                          <Badge variant="secondary">
                            {profile.teacherCode}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-2xl font-semibold tracking-tight">
                            {profile.fullName}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {profile.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {profile.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4" />
                              <span>{profile.phone}</span>
                            </div>
                          )}
                          {profile.branchName && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              <span>{profile.branchName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button>Chỉnh sửa thông tin</Button>
                        <Button
                          variant="ghost"
                          onClick={() => setIsChangePasswordOpen(true)}
                        >
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="@container/main py-6 md:py-8">
                <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-6">
                  {/* Personal Info Section */}
                  <div className="rounded-lg border bg-muted/10 p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Thông tin cá nhân
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Mã giáo viên</span>
                        </div>
                        <p className="text-base text-foreground">
                          {profile.teacherCode}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Họ tên</span>
                        </div>
                        <p className="text-base text-foreground">
                          {profile.fullName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                        <p className="text-base text-foreground">
                          {profile.email}
                        </p>
                      </div>
                      {profile.phone && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>Số điện thoại</span>
                          </div>
                          <p className="text-base text-foreground">
                            {profile.phone}
                          </p>
                        </div>
                      )}
                      {profile.gender && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Giới tính</span>
                          </div>
                          <p className="text-base text-foreground">
                            {profile.gender === "MALE"
                              ? "Nam"
                              : profile.gender === "FEMALE"
                              ? "Nữ"
                              : "Khác"}
                          </p>
                        </div>
                      )}
                      {profile.dateOfBirth && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Ngày sinh</span>
                          </div>
                          <p className="text-base text-foreground">
                            {new Date(profile.dateOfBirth).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      )}
                      {profile.address && (
                        <div className="space-y-1 md:col-span-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Địa chỉ</span>
                          </div>
                          <p className="text-base text-foreground">
                            {profile.address}
                          </p>
                        </div>
                      )}
                      {profile.facebookUrl && (
                        <div className="space-y-1 md:col-span-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Facebook className="h-4 w-4" />
                            <span>Facebook</span>
                          </div>
                          <p className="text-base text-foreground">
                            {profile.facebookUrl}
                          </p>
                        </div>
                      )}
                      {profile.branchName && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Chi nhánh</span>
                          </div>
                          <p className="text-base text-foreground">
                            {profile.branchName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Classes Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Lớp đang dạy</h2>
                      <span className="text-sm text-muted-foreground">
                        {currentClasses.length} lớp
                      </span>
                    </div>

                    {currentClasses.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <School className="h-10 w-10" />
                          </EmptyMedia>
                          <EmptyTitle>Chưa có lớp học</EmptyTitle>
                          <EmptyDescription>
                            Bạn chưa được phân công dạy lớp nào đang hoạt động.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-32">Mã lớp</TableHead>
                              <TableHead>Tên lớp</TableHead>
                              <TableHead className="w-48">Khóa học</TableHead>
                              <TableHead className="w-40">Chi nhánh</TableHead>
                              <TableHead className="w-32 text-center">
                                Ngày phân công
                              </TableHead>
                              <TableHead className="w-48 text-center">
                                Thời gian dạy
                              </TableHead>
                              <TableHead className="w-32 text-center">
                                Trạng thái
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentClasses.map((cls) => (
                              <TableRow
                                key={cls.classId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() =>
                                  navigate(`/teacher/classes/${cls.classId}`)
                                }
                              >
                                <TableCell className="font-medium">
                                  {cls.classCode}
                                </TableCell>
                                <TableCell>{cls.className}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cls.subjectName}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {cls.branchName}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.assignedAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.startDate).toLocaleDateString(
                                    "vi-VN"
                                  )}{" "}
                                  -{" "}
                                  {new Date(
                                    cls.plannedEndDate
                                  ).toLocaleDateString("vi-VN")}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      getClassStatusColor(cls.status)
                                    )}
                                  >
                                    {getClassStatusText(cls.status)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Completed Classes Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Lịch sử lớp học</h2>
                      <span className="text-sm text-muted-foreground">
                        {completedClasses.length} lớp đã kết thúc
                      </span>
                    </div>

                    {completedClasses.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <School className="h-10 w-10" />
                          </EmptyMedia>
                          <EmptyTitle>Chưa có lớp đã kết thúc</EmptyTitle>
                          <EmptyDescription>
                            Bạn chưa hoàn thành lớp học nào.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-32">Mã lớp</TableHead>
                              <TableHead>Tên lớp</TableHead>
                              <TableHead className="w-48">Khóa học</TableHead>
                              <TableHead className="w-40">Chi nhánh</TableHead>
                              <TableHead className="w-32 text-center">
                                Ngày phân công
                              </TableHead>
                              <TableHead className="w-48 text-center">
                                Thời gian dạy
                              </TableHead>
                              <TableHead className="w-32 text-center">
                                Trạng thái
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedClasses.map((cls) => (
                              <TableRow
                                key={cls.classId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() =>
                                  navigate(`/teacher/classes/${cls.classId}`)
                                }
                              >
                                <TableCell className="font-medium">
                                  {cls.classCode}
                                </TableCell>
                                <TableCell>{cls.className}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cls.subjectName}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {cls.branchName}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.assignedAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {new Date(cls.startDate).toLocaleDateString(
                                    "vi-VN"
                                  )}{" "}
                                  -{" "}
                                  {new Date(
                                    cls.plannedEndDate
                                  ).toLocaleDateString("vi-VN")}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      getClassStatusColor(cls.status)
                                    )}
                                  >
                                    {getClassStatusText(cls.status)}
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
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </TeacherRoute>
  );
}
