import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSubmitTransferRequestMutation } from '@/store/services/studentRequestApi'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { format, isBefore, startOfDay, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
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

  const [submitTransfer, { isLoading, error }] = useSubmitTransferRequestMutation()
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
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  const getContentGapSeverity = (severity: string) => {
    switch (severity) {
      case 'NONE':
        return { icon: CheckCircle, text: 'Không thiếu nội dung', color: 'text-green-600' }
      case 'MINOR':
        return { icon: AlertTriangle, text: 'Thiếu ít', color: 'text-yellow-600' }
      case 'MODERATE':
        return { icon: AlertTriangle, text: 'Thiếu vừa phải', color: 'text-orange-600' }
      case 'MAJOR':
        return { icon: AlertTriangle, text: 'Thiếu nhiều', color: 'text-red-600' }
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
  const ContentGapIcon = contentGapInfo.icon

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
      const result = await submitTransfer({
        currentClassId: state.currentClassId,
        targetClassId: state.targetClassId,
        effectiveDate: state.effectiveDate,
        requestReason: state.requestReason.trim(),
        note: '',
      }).unwrap()

      if (result.success) {
        latestSuccessRef.current(result.data)
      }
    } catch {
      // Error is handled by the mutation and displayed below
    }
  }, [submitTransfer])

  useEffect(() => {
    if (typeof onSubmitStateChange !== 'function') return
    onSubmitStateChange({
      canSubmit: isFormValid,
      isLoading,
      submit: handleSubmit,
    })
  }, [handleSubmit, isFormValid, isLoading, onSubmitStateChange])

  return (
    <div className="space-y-8">
      {/* Transfer Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-3">
          <h3 className="font-medium">THÔNG TIN YÊU CẦU CHUYỂN LỚP</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Class */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Từ lớp:</div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">{currentEnrollment.classCode}</span> - {currentEnrollment.className}</div>
                <div className="text-muted-foreground">
                  {currentEnrollment.branchName} • {getModalityText(currentEnrollment.modality)}
                </div>
              </div>
            </div>

            {/* Target Class */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Đến lớp:</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedClass.classCode}</span> - {selectedClass.className}
                </div>
                <div className="text-muted-foreground">
                  {selectedClass.branchName} • {getModalityText(selectedClass.modality)}
                </div>
                <div className="text-muted-foreground">
                  {selectedClass.scheduleDays} • {selectedClass.scheduleTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Gap Analysis */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-3">
          <h3 className="font-medium">PHÂN TÍCH NỘI DUNG</h3>

          <div className="flex items-center gap-2">
            <ContentGapIcon className={cn("w-4 h-4", contentGapInfo.color)} />
            <span className={cn("text-sm font-medium", contentGapInfo.color)}>
              {contentGapInfo.text}: {normalizedContentGap.missedSessions} buổi
            </span>
          </div>

          {normalizedContentGap.missedSessions > 0 && (
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                {normalizedContentGap.recommendation}
              </div>

              {normalizedContentGap.gapSessions.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs space-y-1">
                    {normalizedContentGap.gapSessions.slice(0, 2).map((session, index) => (
                      <div key={index}>
                        Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                      </div>
                    ))}
                    {normalizedContentGap.gapSessions.length > 2 && (
                      <div className="text-muted-foreground">
                        ... và {normalizedContentGap.gapSessions.length - 2} buổi khác
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {normalizedContentGap.missedSessions === 0 && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              Tiến độ tương đương, không thiếu nội dung
            </div>
          )}
        </div>
      </div>

      {/* Effective Date */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">NGÀY HIỆU LỰC</Label>
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
          <div className={cn(
            "text-sm p-3 rounded-lg border",
            dateValidation.valid
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-red-700 bg-red-50 border-red-200"
          )}>
            {dateValidation.message}
          </div>
        )}

        {selectedSession && (
          <div className="text-xs text-muted-foreground">
            {(() => {
              const times = parseTimeSlot(selectedSession.timeSlot)
              return `Thời gian: ${times.start} - ${times.end}`
            })()}
          </div>
        )}
      </div>

      {/* Request Reason */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">LÝ DO CHUYỂN LỚP</Label>
        <Textarea
          placeholder="Nhập lý do chuyển lớp (tối thiểu 10 ký tự)..."
          value={requestReason}
          onChange={(e) => onRequestReasonChange(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between items-center">
          <div className={cn(
            "text-xs",
            requestReason.trim().length >= 10 ? "text-green-700" : "text-muted-foreground"
          )}>
            {requestReason.trim().length}/10 ký tự
          </div>
        </div>
      </div>

      {/* Confirmations */}
      <div className="p-4 bg-muted/30 rounded-lg space-y-3">
        <h3 className="font-medium">XÁC NHẬN CUỐI CÙNG</h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agreed"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agreed" className="text-sm leading-relaxed">
              Tôi đã kiểm tra thông tin và đồng ý với các điều khoản chuyển lớp
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="quota"
              checked={quotaAcknowledged}
              onCheckedChange={(checked) => setQuotaAcknowledged(checked as boolean)}
            />
            <Label htmlFor="quota" className="text-sm leading-relaxed">
              Tôi hiểu hạn mức chuyển ({currentEnrollment.transferQuota.used}/{currentEnrollment.transferQuota.limit}) sẽ bị trừ
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="content-gap"
              checked={contentGapAcknowledged}
              onCheckedChange={(checked) => setContentGapAcknowledged(checked as boolean)}
            />
            <Label htmlFor="content-gap" className="text-sm leading-relaxed">
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
