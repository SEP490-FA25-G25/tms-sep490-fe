'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetMyProfileQuery, useUpdateMyProfileMutation, type UpdateMyProfileRequest } from '@/store/services/studentProfileApi';
import { useUploadFileMutation } from '@/store/services/uploadApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Calendar,
  Pencil,
  KeyRound,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ENROLLMENT_STATUS_STYLES, USER_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors';
import { ChangePasswordDialog } from './components/ChangePasswordDialog';
import { toast } from 'sonner';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export default function StudentProfilePage() {
  const { data: profile, error, isLoading } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const navigate = useNavigate();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    facebookUrl: '',
    avatarUrl: '',
    gender: 'MALE' as Gender,
    dateOfBirth: '',
  });

  // Reset form when profile changes or edit mode starts
  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        facebookUrl: profile.facebookUrl || '',
        avatarUrl: profile.avatarUrl || '',
        gender: (profile.gender as Gender) || 'MALE',
        dateOfBirth: formatDateForInput(profile.dateOfBirth),
      });
    }
  }, [profile]);

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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file tối đa là 5MB');
      return;
    }

    try {
      const response = await uploadFile(file).unwrap();
      setFormData((prev) => ({ ...prev, avatarUrl: response.url }));
      toast.success('Upload ảnh thành công');
    } catch {
      toast.error('Upload ảnh thất bại');
    }

    e.target.value = '';
  };

  const handleStartEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        facebookUrl: profile.facebookUrl || '',
        avatarUrl: profile.avatarUrl || '',
        gender: (profile.gender as Gender) || 'MALE',
        dateOfBirth: formatDateForInput(profile.dateOfBirth),
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        facebookUrl: profile.facebookUrl || '',
        avatarUrl: profile.avatarUrl || '',
        gender: (profile.gender as Gender) || 'MALE',
        dateOfBirth: formatDateForInput(profile.dateOfBirth),
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate phone
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      toast.error('Số điện thoại phải có 10-11 chữ số');
      return;
    }

    try {
      const updateData: UpdateMyProfileRequest = {
        phone: formData.phone?.trim() || undefined,
        facebookUrl: formData.facebookUrl?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        avatarUrl: formData.avatarUrl?.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
      };

      await updateProfile(updateData).unwrap();
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ||
        'Cập nhật thất bại';
      toast.error(errorMessage);
    }
  };

  const isSaving = isUpdating || isUploading;

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
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                      <div className="flex gap-6">
                        {/* Avatar with edit overlay */}
                        <div className="relative h-24 w-24 rounded-full overflow-hidden">
                          <Avatar className="h-24 w-24 border-2 border-background shadow-lg">
                            <AvatarImage src={isEditing ? formData.avatarUrl : profile.avatarUrl || ""} alt={profile.fullName} />
                            <AvatarFallback className="text-2xl font-semibold">
                              {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {/* Edit overlay - only show when editing */}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              disabled={isUploading}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-opacity hover:bg-black/70"
                            >
                              {isUploading ? (
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Pencil className="h-5 w-5 text-white" />
                                  <span className="text-[10px] text-white font-medium">Đổi ảnh</span>
                                </div>
                              )}
                            </button>
                          )}
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={getStatusStyle(USER_STATUS_STYLES, profile.status)}>
                              {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                            </Badge>
                            <Badge variant="secondary">{profile.studentCode}</Badge>
                          </div>
                          <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
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
                            <div className="flex items-center gap-1.5">
                              <Facebook className="h-4 w-4" />
                              {profile.facebookUrl ? (
                                <a
                                  className="text-primary hover:underline"
                                  href={profile.facebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Facebook
                                </a>
                              ) : (
                                <span>Chưa cập nhật</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        {!isEditing && (
                          <Button onClick={handleStartEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa thông tin
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsChangePasswordOpen(true)}>
                          <KeyRound className="h-4 w-4 mr-2" />
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
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                            <X className="h-4 w-4 mr-1" />
                            Hủy
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Read-only fields */}
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

                      {/* Editable fields */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>Số điện thoại</span>
                        </div>
                        {isEditing ? (
                          <Input
                            placeholder="0912345678"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        ) : (
                          <p className="text-base text-foreground">{profile.phone || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Giới tính</span>
                        </div>
                        {isEditing ? (
                          <Select
                            value={formData.gender}
                            onValueChange={(value) => handleInputChange('gender', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {genderOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base text-foreground">
                            {profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Ngày sinh</span>
                        </div>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          />
                        ) : (
                          <p className="text-base text-foreground">
                            {profile.dateOfBirth ?
                              new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') :
                              'Chưa cập nhật'
                            }
                          </p>
                        )}
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Địa chỉ</span>
                        </div>
                        {isEditing ? (
                          <Textarea
                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            rows={2}
                          />
                        ) : (
                          <p className="text-base text-foreground">{profile.address || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Facebook className="h-4 w-4" />
                          <span>Facebook</span>
                        </div>
                        {isEditing ? (
                          <Input
                            placeholder="https://facebook.com/username"
                            value={formData.facebookUrl}
                            onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                          />
                        ) : profile.facebookUrl ? (
                          <a
                            href={profile.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-primary hover:underline break-all"
                          >
                            {profile.facebookUrl}
                          </a>
                        ) : (
                          <p className="text-base text-muted-foreground">Chưa cập nhật</p>
                        )}
                      </div>
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

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </StudentRoute>
  );
}
