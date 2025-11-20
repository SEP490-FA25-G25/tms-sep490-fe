import { useMemo, useState } from 'react'
import { useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WizardFooter } from './WizardFooter'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Step2ReviewSessionsProps {
  classId: number | null
  onBack: () => void
  onContinue: () => void
  onCancelKeepDraft: () => void
  onCancelDelete: () => Promise<void> | void
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('vi-VN')
  } catch {
    return dateString
  }
}

const StatusBadge = ({ label, active }: { label: string; active: boolean }) => (
  <Badge variant={active ? 'default' : 'outline'} className={cn(!active && 'text-muted-foreground')}>
    {active ? `Đã ${label}` : `Chưa ${label}`}
  </Badge>
)

export function Step2ReviewSessions({ classId, onBack, onContinue, onCancelKeepDraft, onCancelDelete }: Step2ReviewSessionsProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'missingTimeSlot' | 'missingResource' | 'missingTeacher'>('all')
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetClassSessionsQuery(classId ?? 0, {
    skip: !classId,
  })

  const overview = data?.data

  const weekOptions = overview?.groupedByWeek ?? []

  const weekSelectOptions = [{ label: 'Tất cả', value: 'all' as const }, ...weekOptions.map((week) => ({
    label: `Tuần ${week.weekNumber}`,
    value: week.weekNumber as number,
  }))]

  const statusFilterOptions = [
    { label: 'Tất cả trạng thái', value: 'all' as const },
    { label: 'Chưa gán khung giờ', value: 'missingTimeSlot' as const },
    { label: 'Chưa gán tài nguyên', value: 'missingResource' as const },
    { label: 'Chưa chọn giáo viên', value: 'missingTeacher' as const },
  ]

  const weekCount = overview?.groupedByWeek?.length ?? 0
  const dateRangeLabel = overview?.dateRange
    ? `${formatDate(overview.dateRange.startDate)} → ${formatDate(overview.dateRange.endDate)}`
    : 'Đang cập nhật...'

  const timelineWeeks = useMemo(() => {
    if (!overview) {
      return []
    }
    const sessionMap = new Map(overview.sessions.map((session) => [session.sessionId, session]))
    const resolveStatus = (session: typeof overview.sessions[number]) => {
      switch (selectedStatus) {
        case 'missingTimeSlot':
          return !session.hasTimeSlot
        case 'missingResource':
          return !session.hasResource
        case 'missingTeacher':
          return !session.hasTeacher
        default:
          return true
      }
    }

    const sourceWeeks = overview.groupedByWeek?.length
      ? overview.groupedByWeek
      : [
          {
            weekNumber: 1,
            weekRange: overview.dateRange
              ? `${formatDate(overview.dateRange.startDate)} - ${formatDate(overview.dateRange.endDate)}`
              : 'Không xác định',
            sessionCount: overview.sessions?.length ?? 0,
            sessionIds: overview.sessions?.map((session) => session.sessionId) ?? [],
          },
        ]

    return sourceWeeks
      .filter((week) => selectedWeek === 'all' || week.weekNumber === selectedWeek)
      .map((week) => {
        const sessions = week.sessionIds
          .map((id) => sessionMap.get(id))
          .filter((session): session is typeof overview.sessions[number] => Boolean(session))
          .filter((session) => resolveStatus(session))
        return { ...week, sessions }
      })
      .filter((week) => week.sessions.length > 0)
  }, [overview, selectedWeek, selectedStatus])

  const hasSessions = timelineWeeks.some((week) => week.sessions.length > 0)

  if (!classId) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Vui lòng hoàn thành Bước 1 để hệ thống tạo lớp học trước khi xem lại các buổi học.
          </AlertDescription>
        </Alert>
        <WizardFooter
          currentStep={2}
          isFirstStep={false}
          isLastStep={false}
          onBack={onBack}
          onNext={onContinue}
          onCancelKeepDraft={onCancelKeepDraft}
          onCancelDelete={onCancelDelete}
          isNextDisabled
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải danh sách buổi học. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border border-border/60">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lịch học tự động</p>
            <h2 className="text-2xl font-semibold mt-1">
              {overview?.totalSessions ?? '--'} buổi · {weekCount || 1} tuần
            </h2>
            <p className="text-sm text-muted-foreground">{dateRangeLabel}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground">Mã lớp</p>
            <p className="text-xl font-semibold">{overview?.classCode ?? '--'}</p>
            <p className="text-xs text-muted-foreground">Xác nhận trước khi gán khung giờ</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs tracking-wide text-muted-foreground">Tuần</Label>
          <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(value === 'all' ? 'all' : parseInt(value))}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {weekSelectOptions.map((option) => (
                <SelectItem key={option.value.toString()} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs tracking-wide text-muted-foreground">Trạng thái</Label>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs tracking-wide text-muted-foreground">Tổng buổi</Label>
          <div className="rounded-xl border px-4 py-3 text-lg font-semibold">
            {overview?.totalSessions ?? '--'}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : hasSessions ? (
        <div className="space-y-6">
          {timelineWeeks.map((week) => (
            <div key={week.weekNumber} className="rounded-2xl border border-border/60 bg-card/70 p-4">
              <div className="flex flex-col gap-1 border-b pb-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tuần {week.weekNumber}</p>
                  <p className="text-base font-semibold">{week.weekRange}</p>
                </div>
                <Badge variant="outline">{week.sessions.length} buổi</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {week.sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-xl border border-border/60 bg-background/90 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Buổi #{session.sequenceNumber}</p>
                        <p className="text-lg font-semibold">{formatDate(session.date)}</p>
                        <p className="text-sm text-muted-foreground">{session.dayOfWeek}</p>
                      </div>
                      <div className="flex-1 md:px-6">
                        <p className="text-sm font-medium">{session.courseSessionName}</p>
                        {session.timeSlotInfo && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Khung giờ: {(session.timeSlotInfo as { label?: string })?.label || 'Đã gán'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs flex-wrap">
                        <StatusBadge label="Khung giờ" active={session.hasTimeSlot} />
                        <StatusBadge label="Tài nguyên" active={session.hasResource} />
                        <StatusBadge label="Giáo viên" active={session.hasTeacher} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            Không tìm thấy buổi học nào khớp với bộ lọc hiện tại. Thử chọn tuần hoặc trạng thái khác.
          </AlertDescription>
        </Alert>
      )}

      <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm -mx-8 px-8 pb-4">
        <WizardFooter
          currentStep={2}
          isFirstStep={false}
          isLastStep={false}
          onBack={onBack}
          onNext={onContinue}
          onCancelKeepDraft={onCancelKeepDraft}
          onCancelDelete={onCancelDelete}
          isNextDisabled={!overview || overview.sessions.length === 0}
        />
      </div>
    </div>
  )
}
