import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSubmitStudentRequestMutation } from '@/store/services/studentRequestApi'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { format, isBefore, startOfDay, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransferEligibility, TransferOption, TransferRequestResponse } from '@/store/services/studentRequestApi'
import TransferErrorDisplay from './TransferErrorDisplay'

interface TransferConfirmationStepProps {
  currentEnrollment: TransferEligibility
  selectedClass: TransferOption
  effectiveDate: string
  requestReason: string
  onEffectiveDateChange: (date: string) => void
  onRequestReasonChange: (reason: string) => void
  onSuccess: (request: TransferRequestResponse) => void
  onSubmitStateChange?: (state: { canSubmit: boolean; isLoading: boolean; submit: () => Promise<void> }) => void
}

export default function TransferConfirmationStep({
  currentEnrollment,
  selectedClass,
  effectiveDate,
  requestReason,
  onEffectiveDateChange,
  onRequestReasonChange,
  onSuccess,
  onSubmitStateChange,
}: TransferConfirmationStepProps) {
  const [agreed, setAgreed] = useState(false)
  const [quotaAcknowledged, setQuotaAcknowledged] = useState(false)
  const [contentGapAcknowledged, setContentGapAcknowledged] = useState(false)

  const [submitTransfer, { isLoading, error }] = useSubmitStudentRequestMutation()
  const latestStateRef = useRef({
    isFormValid: false,
    currentClassId: currentEnrollment.classId,
    targetClassId: selectedClass.classId,
    effectiveDate,
    requestReason,
  })
  const latestSuccessRef = useRef(onSuccess)

  const sessionOptions = useMemo(
    () => selectedClass.upcomingSessions ?? [],
    [selectedClass.upcomingSessions]
  )
  const allowedDateSet = useMemo(() => {
    return new Set(sessionOptions.map((session) => session.date))
  }, [sessionOptions])
  const selectedSession = sessionOptions.find((session) => session.date === effectiveDate)

  const handleErrorContact = () => {
    // Navigate to contact or show contact modal
    // This could be enhanced to show a contact modal
    window.location.href = 'mailto:academic@tms.edu.vn'
  }

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      default: return modality
    }
  }

  const getContentGapSeverity = (severity: string) => {
    switch (severity) {
      case 'NONE':
        return { icon: CheckCircle, text: 'Không thiếu nội dung', color: 'text-emerald-600' }
      case 'MINOR':
        return { icon: AlertTriangle, text: 'Thiếu ít', color: 'text-yellow-600' }
      case 'MODERATE':
        return { icon: AlertTriangle, text: 'Thiếu vừa phải', color: 'text-orange-600' }
      case 'MAJOR':
        return { icon: AlertTriangle, text: 'Thiếu nhiều', color: 'text-rose-600' }
      default:
        return { icon: AlertTriangle, text: 'Không xác định', color: 'text-gray-600' }
    }
  }

  const normalizedContentGap = useMemo(() => {
    if (selectedClass.contentGap) {
      return selectedClass.contentGap
    }

    if (selectedClass.contentGapAnalysis) {
      return {
        severity: selectedClass.contentGapAnalysis.gapLevel,
        missedSessions: selectedClass.contentGapAnalysis.missedSessions,
        gapSessions: selectedClass.contentGapAnalysis.gapSessions,
        recommendation:
          selectedClass.contentGapAnalysis.impactDescription ??
          selectedClass.contentGapAnalysis.recommendedActions?.join('. ') ??
          'Tiến độ tương đương, không thiếu nội dung',
      }
    }

    return {
      severity: 'NONE',
      missedSessions: 0,
      gapSessions: [],
      recommendation: 'Tiến độ tương đương, không thiếu nội dung',
    }
  }, [selectedClass])

  const contentGapInfo = getContentGapSeverity(normalizedContentGap.severity)

  const parseTimeSlot = (timeSlot?: string) => {
    if (!timeSlot) {
      return { start: 'TBD', end: 'TBD' }
    }
    const [start, end] = timeSlot.split('-').map((value) => value.trim())
    return {
      start: start || 'TBD',
      end: end || 'TBD',
    }
  }

  // Validate effective date against actual sessions
  const dateValidation = useMemo(() => {
    if (!effectiveDate) {
      return { valid: false, message: 'Vui lòng chọn ngày hiệu lực' }
    }

    const parsedDate = parseISO(effectiveDate)
    if (!isValid(parsedDate)) {
      return { valid: false, message: 'Ngày không hợp lệ' }
    }

    if (isBefore(parsedDate, startOfDay(new Date()))) {
      return { valid: false, message: 'Ngày hiệu lực phải từ hôm nay trở đi' }
    }

    if (allowedDateSet.size === 0) {
      return { valid: false, message: 'Lớp chưa có lịch học khả dụng. Vui lòng thử lại sau.' }
    }

    if (!allowedDateSet.has(effectiveDate)) {
      return { valid: false, message: 'Chỉ chọn ngày thuộc lịch học của lớp đích' }
    }

    return { valid: true, message: 'Ngày hợp lệ, bạn sẽ tham gia từ buổi này' }
  }, [allowedDateSet, effectiveDate])

  const isFormValid =
    Boolean(effectiveDate) &&
    requestReason.trim().length >= 10 &&
    agreed &&
    quotaAcknowledged &&
    contentGapAcknowledged &&
    dateValidation.valid &&
    Boolean(selectedSession)

  useEffect(() => {
    latestStateRef.current = {
      isFormValid,
      currentClassId: currentEnrollment.classId,
      targetClassId: selectedClass.classId,
      effectiveDate,
      requestReason,
    }
  }, [isFormValid, currentEnrollment.classId, selectedClass.classId, effectiveDate, requestReason])

  useEffect(() => {
    latestSuccessRef.current = onSuccess
  }, [onSuccess])

  const handleSubmit = useCallback(async () => {
    const state = latestStateRef.current
    if (!state.isFormValid) return

    try {
      // Find the session from available sessions that matches the effective date
      const sessionForTransfer = sessionOptions.find(session => session.date === state.effectiveDate)

      if (!sessionForTransfer) {
        throw new Error('Không tìm thấy buổi học tương ứng với ngày hiệu lực đã chọn')
      }

      const result = await submitTransfer({
        requestType: 'TRANSFER',
        currentClassId: state.currentClassId,
        targetSessionId: sessionForTransfer.sessionId,
        requestReason: state.requestReason.trim(),
        note: '',
      }).unwrap()

      if (result.success) {
        // Cast StudentRequest to TransferRequestResponse for compatibility
        // Note: This is a workaround - the actual response is StudentRequest
        latestSuccessRef.current(result.data as unknown as TransferRequestResponse)
      }
    } catch {
      // Error is handled by the mutation and displayed below
    }
  }, [submitTransfer, sessionOptions])

  useEffect(() => {
    if (typeof onSubmitStateChange !== 'function') return
    onSubmitStateChange({
      canSubmit: isFormValid,
      isLoading,
      submit: handleSubmit,
    })
  }, [handleSubmit, isFormValid, isLoading, onSubmitStateChange])

  return (
    <div className="space-y-6">
      {/* Transfer Summary */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-medium">Thông tin yêu cầu chuyển lớp</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Class */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Từ lớp</p>
            <p className="font-semibold">{currentEnrollment.classCode}</p>
            <p className="text-sm text-muted-foreground">{currentEnrollment.className}</p>
            <p className="text-sm text-muted-foreground">
              {currentEnrollment.branchName} · {getModalityText(currentEnrollment.modality || '')}
            </p>
          </div>

          {/* Target Class */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Đến lớp</p>
            <p className="font-semibold">{selectedClass.classCode}</p>
            <p className="text-sm text-muted-foreground">{selectedClass.className}</p>
            <p className="text-sm text-muted-foreground">
              {selectedClass.branchName} · {getModalityText(selectedClass.modality || '')}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedClass.scheduleDays} · {selectedClass.scheduleTime}
            </p>
          </div>
        </div>

        {/* Content Gap - Inline */}
        {normalizedContentGap.missedSessions > 0 ? (
          <div className="space-y-2 border-t pt-4">
            <p className={cn("font-medium", contentGapInfo.color)}>
              {contentGapInfo.text}: {normalizedContentGap.missedSessions} buổi
            </p>
            <p className="text-sm text-muted-foreground">{normalizedContentGap.recommendation}</p>
            {normalizedContentGap.gapSessions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {normalizedContentGap.gapSessions.slice(0, 2).map((session, index) => (
                  <p key={index}>
                    Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                  </p>
                ))}
                {normalizedContentGap.gapSessions.length > 2 && (
                  <p>... và {normalizedContentGap.gapSessions.length - 2} buổi khác</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-4">
            <p className="text-sm text-emerald-600">Tiến độ tương đương, không thiếu nội dung</p>
          </div>
        )}
      </div>

      {/* Effective Date */}
      <div className="space-y-3">
        <Label className="font-medium">Ngày hiệu lực</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !effectiveDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {effectiveDate ? (
                format(new Date(effectiveDate), "PPP", { locale: vi })
              ) : (
                "Chọn ngày bắt đầu học ở lớp mới"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={effectiveDate ? new Date(effectiveDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  onEffectiveDateChange(format(date, 'yyyy-MM-dd'))
                }
              }}
              disabled={(date) => {
                const dateKey = format(date, 'yyyy-MM-dd')
                return isBefore(date, startOfDay(new Date())) || !allowedDateSet.has(dateKey)
              }}
              initialFocus
              locale={vi}
            />
          </PopoverContent>
        </Popover>

        <div className="min-h-[48px]">
          {sessionOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {sessionOptions.slice(0, 4).map((session) => {
                const times = parseTimeSlot(session.timeSlot)
                return (
                  <span
                    key={session.sessionId}
                    className="rounded-full bg-muted px-3 py-1"
                  >
                    {format(parseISO(session.date), 'dd/MM', { locale: vi })} • {times.start}-{times.end}
                  </span>
                )
              })}
              {sessionOptions.length > 4 && (
                <span>+{sessionOptions.length - 4} buổi khác</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lớp chưa có lịch học mở cho chuyển lớp. Vui lòng thử lại sau hoặc liên hệ Học vụ.
            </p>
          )}
        </div>

        {/* Date validation message */}
        {effectiveDate && (
          <p className={cn(
            "text-sm",
            dateValidation.valid ? "text-emerald-600" : "text-rose-600"
          )}>
            {dateValidation.message}
          </p>
        )}

        {selectedSession && (
          <p className="text-sm text-muted-foreground">
            {(() => {
              const times = parseTimeSlot(selectedSession.timeSlot)
              return `Thời gian: ${times.start} - ${times.end}`
            })()}
          </p>
        )}
      </div>

      {/* Request Reason */}
      <div className="space-y-3">
        <Label className="font-medium">Lý do chuyển lớp</Label>
        <Textarea
          placeholder="Nhập lý do chuyển lớp (tối thiểu 10 ký tự)..."
          value={requestReason}
          onChange={(e) => onRequestReasonChange(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between items-center">
          <div className={cn(
            "text-xs",
            requestReason.trim().length >= 10 ? "text-emerald-700" : "text-muted-foreground"
          )}>
            {requestReason.trim().length}/10 ký tự
          </div>
        </div>
      </div>

      {/* Confirmations */}
      <div className="space-y-3 border-t pt-6">
        <h3 className="font-medium">Xác nhận cuối cùng</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agreed"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agreed" className="text-sm leading-relaxed cursor-pointer">
              Tôi đã kiểm tra thông tin và đồng ý với các điều khoản chuyển lớp
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="quota"
              checked={quotaAcknowledged}
              onCheckedChange={(checked) => setQuotaAcknowledged(checked as boolean)}
            />
            <Label htmlFor="quota" className="text-sm leading-relaxed cursor-pointer">
              Tôi hiểu hạn mức chuyển ({currentEnrollment.transferQuota.used}/{currentEnrollment.transferQuota.limit}) sẽ bị trừ
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="content-gap"
              checked={contentGapAcknowledged}
              onCheckedChange={(checked) => setContentGapAcknowledged(checked as boolean)}
            />
            <Label htmlFor="content-gap" className="text-sm leading-relaxed cursor-pointer">
              Tôi đã đọc và hiểu phân tích nội dung bị thiếu (nếu có)
            </Label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <TransferErrorDisplay
          error={error}
          onRetry={() => {
            // Retry submission
          }}
          onContact={handleErrorContact}
        />
      )}

    </div>
  )
}
