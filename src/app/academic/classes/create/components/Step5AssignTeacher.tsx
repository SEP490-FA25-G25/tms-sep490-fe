import { Fragment, useState } from 'react'
import {
  useAssignTeacherMutation,
  useGetTeacherAvailabilityQuery,
  useLazyGetTeacherAvailabilityQuery,
} from '@/store/services/classCreationApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WizardFooter } from './WizardFooter'
import { toast } from 'sonner'
import type {
  TeacherAvailability,
  TeacherConflictDetail,
  TeacherDayAvailability,
} from '@/types/classCreation'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Step5AssignTeacherProps {
  classId: number | null
  onBack: () => void
  onContinue: () => void
}

const DAY_LABELS: Record<number, string> = {
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
  7: 'Chủ nhật',
}

const formatDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(dateString)
    )
  } catch {
    return dateString
  }
}

const getAvailabilityText = (teacher: TeacherAvailability) => {
  if (teacher.isRecommended) {
    return `✅ 100% - Có thể dạy tất cả ${teacher.totalSessions} buổi`
  }

  if (teacher.conflictCount === teacher.totalSessions) {
    return `⚠️ 0% - Xung đột ${teacher.conflictCount}/${teacher.totalSessions} buổi`
  }

  const rate = Math.round(teacher.availabilityRate)
  return `⚠️ ${rate}% - Xung đột ${teacher.conflictCount}/${teacher.totalSessions} buổi`
}

const AvailabilitySummary = ({ teacher }: { teacher: TeacherAvailability }) => (
  <div className="text-sm font-medium text-foreground">{getAvailabilityText(teacher)}</div>
)

const SkillsList = ({ skills }: { skills: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {skills.map((skill) => (
      <Badge key={skill} variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium">
        {skill}
      </Badge>
    ))}
  </div>
)

const DayAvailabilityList = ({ availability }: Record<number, TeacherDayAvailability>) => {
  const entries = Object.entries(availability).sort(([a], [b]) => Number(a) - Number(b))
  return (
    <div className="space-y-2">
      {entries.map(([day, stats]) => (
        <div key={day} className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{DAY_LABELS[Number(day)] || `Ngày ${day}`}</span>
          <span>
            {stats.available}/{stats.total} buổi ({Math.round(stats.rate)}%)
          </span>
        </div>
      ))}
    </div>
  )
}

const ConflictList = ({ conflicts }: { conflicts: TeacherConflictDetail[] }) => {
  const preview = conflicts.slice(0, 4)
  const remaining = conflicts.length - preview.length

  return (
    <div className="space-y-3">
      {preview.map((conflict, index) => (
        <div key={`${conflict.sessionDate}-${index}`} className="rounded-xl bg-muted/60 px-3 py-2">
          <div className="text-sm font-semibold">
            {conflict.dayOfWeek}, {formatDate(conflict.sessionDate)} · {conflict.timeSlot.displayTime}
          </div>
          <p className="text-sm text-muted-foreground">
            Đang dạy: {conflict.conflictingClass.name} ({conflict.conflictingClass.code})
          </p>
          {conflict.resource && (
            <p className="text-xs text-muted-foreground">Phòng: {conflict.resource.name}</p>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">… và {remaining} xung đột khác</p>
      )}
    </div>
  )
}

const RecommendedTeacherCard = ({
  teacher,
  onAssign,
  isAssigning,
}: {
  teacher: TeacherAvailability
  onAssign: () => void
  isAssigning: boolean
}) => (
  <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
    <div className="space-y-3">
      <Badge className="w-fit bg-emerald-600 text-[11px] uppercase tracking-wide text-white">🎯 Khuyến nghị</Badge>
      <div>
        <p className="text-lg font-semibold text-foreground">{teacher.name}</p>
        <p className="text-sm text-muted-foreground">{teacher.email}</p>
      </div>
      <SkillsList skills={teacher.skills} />
      <div className="rounded-xl bg-white/80 p-3">
        <AvailabilitySummary teacher={teacher} />
        <p className="text-xs text-muted-foreground">{teacher.availableSessions}/{teacher.totalSessions} buổi</p>
      </div>
    </div>
    <Button className="mt-4" onClick={onAssign} disabled={isAssigning}>
      {isAssigning ? 'Đang phân công…' : 'Chọn giáo viên'}
    </Button>
  </div>
)

const ConflictTeacherCard = ({
  teacher,
  expanded,
  onToggle,
  onAssign,
  isAssigning,
  isLoadingDetails,
}: {
  teacher: TeacherAvailability
  expanded: boolean
  onToggle: () => void
  onAssign: () => void
  isAssigning: boolean
  isLoadingDetails: boolean
}) => (
  <div
    className={cn(
      'rounded-2xl border p-4 transition-colors',
      teacher.availabilityRate === 0 ? 'border-rose-200 bg-rose-50/40' : 'border-amber-200 bg-amber-50/30'
    )}
  >
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit border-amber-400 bg-amber-100 text-amber-900">
          ⚠️ Có xung đột
        </Badge>
        <div>
          <p className="text-base font-semibold text-foreground">{teacher.name}</p>
          <p className="text-sm text-muted-foreground">{teacher.email}</p>
        </div>
        <SkillsList skills={teacher.skills} />
        <AvailabilitySummary teacher={teacher} />
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <Button variant="outline" size="sm" onClick={onToggle} disabled={isLoadingDetails && !expanded}>
          {expanded ? (
            <>
              Ẩn chi tiết <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Xem chi tiết <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
        <Button onClick={onAssign} disabled={isAssigning}>
          {isAssigning ? 'Đang phân công…' : 'Chọn giáo viên'}
        </Button>
      </div>
    </div>

    {expanded && (
      <div className="mt-4 space-y-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-4">
        {isLoadingDetails ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : (
          <Fragment>
            {teacher.conflicts && teacher.conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">📅 Chi tiết xung đột</p>
                <ConflictList conflicts={teacher.conflicts} />
              </div>
            )}
            {teacher.availabilityByDay && Object.keys(teacher.availabilityByDay).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">📊 Thống kê theo ngày</p>
                <DayAvailabilityList availability={teacher.availabilityByDay} />
              </div>
            )}
            {!teacher.conflicts?.length && !teacher.availabilityByDay && (
              <p className="text-sm text-muted-foreground">Không có dữ liệu chi tiết.</p>
            )}
          </Fragment>
        )}
      </div>
    )}
  </div>
)

export function Step5AssignTeacher({ classId, onBack, onContinue }: Step5AssignTeacherProps) {
  const [assignTeacher, { isLoading: isSubmitting }] = useAssignTeacherMutation()
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetTeacherAvailabilityQuery(
    { classId: classId ?? 0, includeConflictDetails: false },
    { skip: !classId }
  )
  const [loadDetails, { isFetching: isFetchingDetails }] = useLazyGetTeacherAvailabilityQuery()

  const [pendingTeacherId, setPendingTeacherId] = useState<number | null>(null)
  const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(null)
  const [detailedMap, setDetailedMap] = useState<Record<number, TeacherAvailability>>({})
  const [hasLoadedDetails, setHasLoadedDetails] = useState(false)

  const teachers = data?.data ?? []
  const recommendedTeachers = teachers.filter((t) => t.isRecommended)
  const conflictedTeachers = teachers.filter((t) => !t.isRecommended)

  const getTeacherWithDetails = (teacher: TeacherAvailability) => detailedMap[teacher.id] ?? teacher

  const handleAssign = async (teacherId: number) => {
    if (!classId) return
    setPendingTeacherId(teacherId)
    try {
      const response = await assignTeacher({ classId, data: { teacherId } }).unwrap()
      toast.success(response.message || 'Đã phân công giáo viên')
      if (response.data.needsSubstitute) {
        toast.message('Cần phân công thêm giáo viên cho các buổi còn lại')
      } else {
        onContinue()
      }
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Không thể phân công giáo viên. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setPendingTeacherId(null)
    }
  }

  const handleToggleConflicts = async (teacherId: number) => {
    if (expandedTeacherId === teacherId) {
      setExpandedTeacherId(null)
      return
    }
    setExpandedTeacherId(teacherId)
    if (!classId || hasLoadedDetails || detailedMap[teacherId]) return
    try {
      const response = await loadDetails({ classId, includeConflictDetails: true }).unwrap()
      setDetailedMap((prev) => {
        const next = { ...prev }
        response.data.forEach((teacher) => {
          next[teacher.id] = teacher
        })
        return next
      })
      setHasLoadedDetails(true)
    } catch {
      toast.error('Không thể tải chi tiết xung đột giáo viên.')
    }
  }

  if (!classId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Vui lòng tạo lớp (Bước 1) trước khi chọn giáo viên.</AlertDescription>
        </Alert>
        <WizardFooter currentStep={5} isFirstStep={false} isLastStep={false} onBack={onBack} onNext={onContinue} isNextDisabled />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chọn giáo viên phù hợp</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ưu tiên giáo viên có khả dụng 100%. Bạn có thể gán nhiều giáo viên, xem chi tiết xung đột để quyết định.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : isError ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertDescription>Không thể tải danh sách giáo viên. Vui lòng thử lại.</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : teachers.length === 0 ? (
            <Alert>
              <AlertDescription>Chưa có giáo viên phù hợp cho lớp này.</AlertDescription>
            </Alert>
          ) : (
            <Fragment>
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    ✅ Giáo viên khuyến nghị ({recommendedTeachers.length})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Đã sẵn sàng cho toàn bộ lịch học ({teachers[0]?.totalSessions ?? 0} buổi).
                  </p>
                </div>
                {recommendedTeachers.length === 0 ? (
                  <Alert>
                    <AlertDescription>Không có giáo viên nào đạt mức khả dụng 100%.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendedTeachers.map((teacher) => (
                      <RecommendedTeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        onAssign={() => handleAssign(teacher.id)}
                        isAssigning={isSubmitting && pendingTeacherId === teacher.id}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-amber-600">
                    ⚠️ Giáo viên có xung đột ({conflictedTeachers.length})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Xem chi tiết để cân nhắc điều chỉnh lịch hoặc chia ca cùng giáo viên khác.
                  </p>
                </div>
                {conflictedTeachers.length === 0 ? (
                  <Alert>
                    <AlertDescription>Tất cả giáo viên đều đạt yêu cầu.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {conflictedTeachers.map((teacher) => {
                      const teacherData = getTeacherWithDetails(teacher)
                      return (
                        <ConflictTeacherCard
                          key={teacher.id}
                          teacher={teacherData}
                          expanded={expandedTeacherId === teacher.id}
                          onToggle={() => handleToggleConflicts(teacher.id)}
                          onAssign={() => handleAssign(teacher.id)}
                          isAssigning={isSubmitting && pendingTeacherId === teacher.id}
                          isLoadingDetails={isFetchingDetails && !hasLoadedDetails}
                        />
                      )
                    })}
                  </div>
                )}
              </section>
            </Fragment>
          )}
        </CardContent>
      </Card>

      <WizardFooter
        currentStep={5}
        isFirstStep={false}
        isLastStep={false}
        onBack={onBack}
        onNext={onContinue}
        nextButtonText="Bỏ qua bước này"
      />
    </div>
  )
}
