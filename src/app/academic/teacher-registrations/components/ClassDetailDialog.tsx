import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'
import {
  CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  Star,
  BookOpen,
  UserCheck,
} from 'lucide-react'
import {
  useGetClassRegistrationsQuery,
  useApproveRegistrationMutation,
  type ClassRegistrationSummaryDTO,
} from '@/store/services/teacherRegistrationApi'

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
}

interface ClassDetailDialogProps {
  classData: ClassRegistrationSummaryDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Teacher skills badges
function TeacherSkillsBadges({
  skills,
}: {
  skills: { skill: string; specialization: string; language: string; level: number }[]
}) {
  if (!skills || skills.length === 0) {
    return <span className="text-muted-foreground text-sm">Chưa có kỹ năng</span>
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {skills.slice(0, 3).map((skill, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                {skill.skill}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{skill.specialization}</p>
              <p>
                {skill.language} - Level {skill.level}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {skills.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{skills.length - 3}
        </Badge>
      )}
    </div>
  )
}

export function ClassDetailDialog({ classData, open, onOpenChange }: ClassDetailDialogProps) {
  const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null)

  // Fetch detailed registrations when dialog opens
  const {
    data: detailResponse,
    isLoading,
    isFetching,
  } = useGetClassRegistrationsQuery(classData?.classId ?? 0, {
    skip: !open || !classData?.classId,
  })

  const [approveRegistration, { isLoading: isApproving }] = useApproveRegistrationMutation()

  const detail = detailResponse?.data
  const registrations = detail?.registrations ?? classData?.registrations ?? []
  const hasAssignedTeacher = detail?.assignedTeacherId !== null || classData?.assignedTeacherId !== null

  const handleApprove = async () => {
    if (!confirmApproveId) return

    try {
      await approveRegistration({ registrationId: confirmApproveId }).unwrap()
      toast.success('Đã chọn giáo viên thành công')
      setConfirmApproveId(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi chọn giáo viên')
    }
  }

  if (!classData) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Chi tiết lớp học
            </DialogTitle>
          </DialogHeader>

          {/* Class Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{classData.className}</span>
                <Badge
                  variant={classData.modality === 'ONLINE' ? 'secondary' : 'default'}
                  className={
                    classData.modality === 'ONLINE'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  }
                >
                  {classData.modality === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {classData.classCode} • {classData.subjectName}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Ngày bắt đầu</p>
                    <p className="font-medium">{format(parseISO(classData.startDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Hạn đăng ký</p>
                    <p className="font-medium">
                      {format(parseISO(classData.registrationCloseDate), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Số đăng ký</p>
                    <p className="font-medium">{classData.pendingCount} giáo viên</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Lịch học</p>
                  <div className="flex gap-1 flex-wrap">
                    {classData.scheduleDays.map((day) => (
                      <Badge
                        key={day}
                        variant="outline"
                        className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {DAYS_OF_WEEK[day]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {hasAssignedTeacher && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">
                    Giáo viên được chọn: {detail?.assignedTeacherName || classData.assignedTeacherName}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registrations List */}
          <div className="mt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Danh sách giáo viên đăng ký ({registrations.length})
            </h3>

            {isLoading || isFetching ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có giáo viên nào đăng ký</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Loại HĐ</TableHead>
                      <TableHead>Số lớp</TableHead>
                      <TableHead>Kỹ năng</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Ngày ĐK</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow
                        key={reg.registrationId}
                        className={
                          reg.status === 'APPROVED'
                            ? 'bg-emerald-50'
                            : reg.status === 'REJECTED'
                            ? 'bg-red-50 opacity-60'
                            : ''
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{reg.teacherName}</p>
                            <p className="text-xs text-muted-foreground">{reg.teacherEmail}</p>
                            <p className="text-xs text-muted-foreground">{reg.employeeCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CONTRACT_TYPE_LABELS[reg.contractType] || reg.contractType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={reg.currentClassCount >= 5 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {reg.currentClassCount} lớp
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TeacherSkillsBadges skills={reg.skills} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
                            {reg.note || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(parseISO(reg.registeredAt), 'dd/MM HH:mm')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {reg.status === 'PENDING' && !hasAssignedTeacher ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmApproveId(reg.registrationId)
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Chọn
                            </Button>
                          ) : reg.status === 'APPROVED' ? (
                            <Badge className="bg-emerald-500">Đã chọn</Badge>
                          ) : reg.status === 'REJECTED' ? (
                            <Badge variant="destructive">Đã từ chối</Badge>
                          ) : (
                            <Badge variant="secondary">Đã hủy</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Approve Dialog */}
      <AlertDialog open={confirmApproveId !== null} onOpenChange={() => setConfirmApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chọn giáo viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn chọn giáo viên này cho lớp học? Các đăng ký khác sẽ tự động bị từ
              chối.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
