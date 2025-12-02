import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentStatusBadge, EnrollmentStatusBadge } from './StudentStatusBadge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  X,
  Facebook,
  Loader2,
} from 'lucide-react'

// Types - match với API response
interface StudentEnrollment {
  id: number
  classId: number
  classCode: string
  className: string
  courseName: string
  status: 'ENROLLED' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED' | string
  enrolledAt: string
  leftAt: string | null
}

interface StudentDetail {
  id: number
  studentCode: string
  fullName: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string
  dob: string | null
  phone: string | null
  email: string | null
  address: string | null
  facebookUrl: string | null
  avatarUrl: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | string
  createdAt: string
  enrollments: StudentEnrollment[]
}

interface StudentDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentDetail | null
  isLoading?: boolean
  onEdit?: () => void
  onEnroll?: () => void
  /** Hide the enroll button (e.g., when viewing from class detail where student is already enrolled) */
  hideEnrollButton?: boolean
}

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('vi-VN')
}

export function StudentDetailDrawer({
  open,
  onOpenChange,
  student,
  isLoading = false,
  onEdit,
  onEnroll,
  hideEnrollButton = false,
}: StudentDetailDrawerProps) {
  const hasActiveEnrollment = student?.enrollments?.some(
    (e) => e.status === 'ENROLLED'
  )

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-full w-full sm:w-[480px] sm:max-w-lg">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isLoading ? (
                <>
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
                </>
              ) : student ? (
                <>
                  <DrawerTitle className="text-xl">{student.fullName}</DrawerTitle>
                  <DrawerDescription className="flex items-center gap-2 mt-1">
                    <span className="font-mono">{student.studentCode}</span>
                    <span>•</span>
                    <StudentStatusBadge status={student.status as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'} />
                  </DrawerDescription>
                </>
              ) : (
                <DrawerTitle>Chi tiết học viên</DrawerTitle>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !student ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Không tìm thấy thông tin học viên</p>
            </div>
          ) : (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Thông tin
                </TabsTrigger>
                <TabsTrigger
                  value="classes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Lớp học ({student.enrollments?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-0 p-4">
                <div className="space-y-4">
                  {/* Thông tin cơ bản */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Thông tin cơ bản
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Giới tính:
                        </span>
                        <span>{genderLabels[student.gender] || student.gender}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Ngày sinh:
                        </span>
                        <span>{formatDate(student.dob)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin liên hệ */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Thông tin liên hệ
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Điện thoại:
                        </span>
                        <span>{student.phone || '—'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Email:
                        </span>
                        <span className="truncate">{student.email || '—'}</span>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Địa chỉ:
                        </span>
                        <span className="flex-1">{student.address || '—'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground min-w-[80px]">
                          Facebook:
                        </span>
                        {student.facebookUrl ? (
                          <a
                            href={student.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {student.facebookUrl}
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thông tin hệ thống */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Thông tin hệ thống
                    </h4>

                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground min-w-[80px]">
                        Ngày tạo:
                      </span>
                      <span>{formatDateTime(student.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="classes" className="mt-0 p-4">
                {!student.enrollments || student.enrollments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Học viên chưa được phân lớp</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {student.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {enrollment.className}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {enrollment.classCode} • {enrollment.courseName}
                            </div>
                          </div>
                          <EnrollmentStatusBadge status={enrollment.status as 'ENROLLED' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED'} />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <span>Ghi danh: {formatDate(enrollment.enrolledAt)}</span>
                          {enrollment.leftAt && (
                            <span> • Kết thúc: {formatDate(enrollment.leftAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onEdit} disabled={isLoading || !student}>
              Sửa thông tin
            </Button>
            {!hideEnrollButton && !hasActiveEnrollment && (
              <Button className="flex-1" onClick={onEnroll} disabled={isLoading || !student}>
                Phân lớp
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
