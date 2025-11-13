import { useState, useMemo } from 'react'
import { useSubmitTransferRequestMutation } from '@/store/services/studentRequestApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { format, isBefore, startOfDay, addDays, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
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
  onPrevious: () => void
  onSuccess: (request: TransferRequestResponse) => void
}

export default function TransferConfirmationStep({
  currentEnrollment,
  selectedClass,
  effectiveDate,
  requestReason,
  onEffectiveDateChange,
  onRequestReasonChange,
  onPrevious,
  onSuccess,
}: TransferConfirmationStepProps) {
  const [agreed, setAgreed] = useState(false)
  const [quotaAcknowledged, setQuotaAcknowledged] = useState(false)
  const [contentGapAcknowledged, setContentGapAcknowledged] = useState(false)

  const [submitTransfer, { isLoading, error }] = useSubmitTransferRequestMutation()

  const handleSubmit = async () => {
    if (!isFormValid) return

    try {
      const result = await submitTransfer({
        currentClassId: currentEnrollment.classId,
        targetClassId: selectedClass.classId,
        effectiveDate,
        requestReason: requestReason.trim(),
        note: '',
      }).unwrap()

      if (result.success) {
        onSuccess(result.data)
      }
    } catch {
      // Error is handled by the mutation and displayed below
    }
  }

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

  const contentGapInfo = getContentGapSeverity(selectedClass.contentGap.severity)
  const ContentGapIcon = contentGapInfo.icon

  // Validate effective date against class schedule
  const dateValidation = useMemo(() => {
    if (!effectiveDate) return { valid: false, message: 'Vui lòng chọn ngày hiệu lực' }

    const parsedDate = parseISO(effectiveDate)
    if (!isValid(parsedDate)) return { valid: false, message: 'Ngày không hợp lệ' }

    // Check if date is in the future
    if (isBefore(parsedDate, startOfDay(new Date()))) {
      return { valid: false, message: 'Ngày hiệu lực phải là ngày trong tương lai' }
    }

    // Mock schedule validation - in real implementation, this should check against actual class sessions
    // For now, we'll assume the class has sessions on specific weekdays
    const classScheduleDays = selectedClass.scheduleDays.toLowerCase()
    const dayOfWeek = parsedDate.getDay() // 0=Sunday, 1=Monday, etc.

    let isValidDay = false
    if (classScheduleDays.includes('thứ 2') || classScheduleDays.includes('mon') || classScheduleDays.includes('t2')) {
      isValidDay = isValidDay || dayOfWeek === 1
    }
    if (classScheduleDays.includes('thứ 3') || classScheduleDays.includes('tue') || classScheduleDays.includes('t3')) {
      isValidDay = isValidDay || dayOfWeek === 2
    }
    if (classScheduleDays.includes('thứ 4') || classScheduleDays.includes('wed') || classScheduleDays.includes('t4')) {
      isValidDay = isValidDay || dayOfWeek === 3
    }
    if (classScheduleDays.includes('thứ 5') || classScheduleDays.includes('thu') || classScheduleDays.includes('t5')) {
      isValidDay = isValidDay || dayOfWeek === 4
    }
    if (classScheduleDays.includes('thứ 6') || classScheduleDays.includes('fri') || classScheduleDays.includes('t6')) {
      isValidDay = isValidDay || dayOfWeek === 5
    }
    if (classScheduleDays.includes('thứ 7') || classScheduleDays.includes('sat') || classScheduleDays.includes('t7')) {
      isValidDay = isValidDay || dayOfWeek === 6
    }
    if (classScheduleDays.includes('chủ nhật') || classScheduleDays.includes('sun') || classScheduleDays.includes('cn')) {
      isValidDay = isValidDay || dayOfWeek === 0
    }

    if (!isValidDay) {
      return {
        valid: false,
        message: `Ngày ${format(parsedDate, 'EEEE', { locale: vi })} không phải là ngày học của lớp. Lớp học vào ${selectedClass.scheduleDays}`
      }
    }

    // Check if date is too far in the future (more than 2 months)
    const twoMonthsFromNow = addDays(new Date(), 60)
    if (parsedDate > twoMonthsFromNow) {
      return { valid: false, message: 'Ngày hiệu lực không được quá 2 tháng kể từ ngày hiện tại' }
    }

    return { valid: true, message: 'Ngày hiệu lực hợp lệ' }
  }, [effectiveDate, selectedClass.scheduleDays])

  const isFormValid =
    effectiveDate &&
    requestReason.trim().length >= 10 &&
    agreed &&
    quotaAcknowledged &&
    contentGapAcknowledged &&
    dateValidation.valid

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
              {contentGapInfo.text}: {selectedClass.contentGap.missedSessions} buổi
            </span>
          </div>

          {selectedClass.contentGap.missedSessions > 0 && (
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                {selectedClass.contentGap.recommendation}
              </div>

              {selectedClass.contentGap.gapSessions.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs space-y-1">
                    {selectedClass.contentGap.gapSessions.slice(0, 2).map((session, index) => (
                      <div key={index}>
                        Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                      </div>
                    ))}
                    {selectedClass.contentGap.gapSessions.length > 2 && (
                      <div className="text-muted-foreground">
                        ... và {selectedClass.contentGap.gapSessions.length - 2} buổi khác
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedClass.contentGap.missedSessions === 0 && (
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
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              initialFocus
              locale={vi}
            />
          </PopoverContent>
        </Popover>

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

        {effectiveDate && !dateValidation.valid && (
          <div className="text-xs text-muted-foreground">
            Lớp học lịch: {selectedClass.scheduleDays}
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

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Quay lại
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Nộp yêu cầu'
          )}
        </Button>
      </div>
    </div>
  )
}