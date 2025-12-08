import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useGetClassByIdQuery, classApi } from '@/store/services/classApi'
import { useSubmitClassMutation, useValidateClassMutation } from '@/store/services/classCreationApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { ValidateClassData, ValidationChecks } from '@/types/classCreation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
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

const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
}

const formatScheduleDays = (days?: number[], fallback?: string): string => {
  if (days && days.length > 0) {
    const normalized = Array.from(new Set(days))
      .map((day) => {
        if (typeof day !== 'number' || Number.isNaN(day)) return undefined
        return ((day % 7) + 7) % 7
      })
      .filter((day): day is number => typeof day === 'number')
      .sort((a, b) => a - b)

    if (normalized.length > 0) {
      return normalized.map((day) => DAY_SHORT_LABELS[day] ?? `Thứ ${day}`).join(' / ')
    }
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback
  }

  return '--'
}

interface Step7SubmitProps {
  classId: number | null
  onBack: () => void
  onFinish?: () => void
}

export function Step7Submit({
  classId,
  onBack,
  onFinish,
}: Step7SubmitProps) {
  const dispatch = useDispatch()
  const { data: classDetail, isLoading: isClassLoading } = useGetClassByIdQuery(classId ?? 0, {
    skip: !classId,
  })
  const [validateClass, { isLoading: isValidating }] = useValidateClassMutation()
  const [submitClass, { isLoading: isSubmitting }] = useSubmitClassMutation()
  const [validationResult, setValidationResult] = useState<ValidateClassData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!classId) return
    void handleValidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  const overview = classDetail?.data
  const defaultTotal = overview?.upcomingSessions?.length ?? 0
  const summaryChecks: ValidationChecks = validationResult?.checks || {
    totalSessions: defaultTotal,
    sessionsWithTimeSlots: overview?.upcomingSessions?.length ?? 0,
    sessionsWithResources: 0,
    sessionsWithTeachers: 0,
    sessionsWithoutTimeSlots: 0,
    sessionsWithoutResources: 0,
    sessionsWithoutTeachers: 0,
    completionPercentage: 0,
    allSessionsHaveTimeSlots: false,
    allSessionsHaveResources: false,
    allSessionsHaveTeachers: false,
  }

  const canSubmitValidation = Boolean(validationResult?.canSubmit && validationResult.valid && validationResult.errors.length === 0)
  const submitDisabled = !classId || !canSubmitValidation || isSubmitting

  const handleValidate = async () => {
    if (!classId) return
    setValidationError(null)
    try {
      const response = await validateClass(classId).unwrap()
      if (response.data) {
        setValidationResult(response.data)
      } else {
        setValidationResult(null)
        setValidationError(response.message || 'Không thể kiểm tra lớp học.')
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể kiểm tra lớp học.'
      setValidationError(message)
      setValidationResult(null)
    }
  }

  const handleSubmit = async () => {
    if (!classId) return
    try {
      const response = await submitClass(classId).unwrap()
      toast.success(response.message || 'Lớp đã được gửi duyệt.')
      dispatch(classApi.util.invalidateTags(['Classes']))
      onFinish?.()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể gửi duyệt. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const infoRows = useMemo(() => {
    if (!overview) return []
    const data = overview
    return [
      { label: 'Mã lớp', value: data.code },
      { label: 'Khóa học', value: data.course?.name },
      { label: 'Chi nhánh', value: data.branch?.name },
      { label: 'Ngày bắt đầu', value: data.startDate },
      { label: 'Ngày kết thúc dự kiến', value: data.plannedEndDate },
      {
        label: 'Ngày học',
        value: formatScheduleDays(data.scheduleDays, data.scheduleSummary),
      },
      { label: 'Sức chứa tối đa', value: data.maxCapacity?.toString() },
    ]
  }, [overview])

  if (!classId) {
    return (
      <Alert>
        <AlertDescription>Vui lòng tạo lớp và hoàn thành các bước trước khi gửi duyệt.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Tổng quan sẵn sàng</CardTitle>
          <p className="text-sm text-muted-foreground">Kiểm tra nhanh các tiêu chí bắt buộc trước khi gửi duyệt.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng buổi', value: summaryChecks.totalSessions },
            { label: 'Đã có khung giờ', value: summaryChecks.sessionsWithTimeSlots, hint: summaryChecks.sessionsWithoutTimeSlots },
            { label: 'Đã có tài nguyên', value: summaryChecks.sessionsWithResources, hint: summaryChecks.sessionsWithoutResources },
            { label: 'Đã có giáo viên', value: summaryChecks.sessionsWithTeachers, hint: summaryChecks.sessionsWithoutTeachers },
          ].map((item) => (
            <div key={item.label} className={cn('rounded-xl border bg-background/80 p-4', item.hint && item.hint > 0 && 'border-amber-300 bg-amber-50/60')}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold text-foreground">{item.value ?? '--'}</p>
              {item.hint !== undefined && item.hint > 0 && (
                <p className="text-xs text-amber-700">{item.hint} buổi chưa hoàn thành</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Thông tin lớp học</CardTitle>
          <p className="text-sm text-muted-foreground">Kiểm tra lại các thông tin chính trước khi gửi duyệt.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {isClassLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải thông tin lớp…</p>
          ) : (
            infoRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-border/50 bg-card/60 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                <p className="text-base font-semibold text-foreground">{row.value || '--'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Checklist trước khi gửi</CardTitle>
          <p className="text-sm text-muted-foreground">Xác nhận rằng bạn đã hoàn thành các bước sau.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChecklistLabel
            label="Thông tin lớp chính xác"
            description="Đã rà soát lại mã lớp, lịch học, tài nguyên, giáo viên."
            checked={checklist.accuracy}
            onCheckedChange={(value) => setChecklist((prev) => ({ ...prev, accuracy: value }))}
          />
          <ChecklistLabel
            label="Đã thông báo các bên liên quan"
            description="Đã thông báo cho giảng viên, CSKH hoặc các bộ phận liên quan nếu có thay đổi."
            checked={checklist.notify}
            onCheckedChange={(value) => setChecklist((prev) => ({ ...prev, notify: value }))}
          />
          <ChecklistLabel
            label="Đính kèm ghi chú nếu cần"
            description="Thêm ghi chú cho Trưởng chi nhánh (nếu có yêu cầu đặc biệt)."
            checked={checklist.attachments}
            onCheckedChange={(value) => setChecklist((prev) => ({ ...prev, attachments: value }))}
          />
        </CardContent>
      </Card>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Quay lại
        </Button>
        <Button variant="ghost" onClick={() => setIsCancelDialogOpen(true)} disabled={isSubmitting}>
          Hủy &amp; về danh sách
        </Button>
        <Button variant="outline" onClick={handleValidate} disabled={isValidating || isSubmitting}>
          {isValidating ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
        </Button>
        <Button onClick={handleSubmit} disabled={submitDisabled}>
          {isSubmitting ? 'Đang gửi duyệt…' : 'Gửi duyệt lớp học'}
        </Button>
      </div>
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời khỏi wizard tạo lớp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thể giữ lớp ở trạng thái nháp để tiếp tục sau, hoặc xóa hoàn toàn lớp này. Hành động này không ảnh hưởng đến các lớp khác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsCancelDialogOpen(false)
                onCancelKeepDraft()
              }}
            >
              Giữ lớp (DRAFT)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onCancelDelete()
                setIsCancelDialogOpen(false)
              }}
            >
              Xóa lớp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
