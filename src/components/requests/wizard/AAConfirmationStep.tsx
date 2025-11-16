import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isBefore, startOfDay, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import TransferErrorDisplay from '../TransferErrorDisplay'
import type { AATransferWizardData } from '@/types/academicTransfer'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useGetClassByIdQuery } from '@/store/services/classApi'

interface AAConfirmationStepProps {
  wizardData: AATransferWizardData
  onEffectiveDateChange: (date: string) => void
  onRequestReasonChange: (reason: string) => void
  onNoteChange: (note: string) => void
  onPrevious: () => void
  onSubmit: () => void
  isLoading: boolean
  error: FetchBaseQueryError | SerializedError | undefined
}

export default function AAConfirmationStep({
  wizardData,
  onEffectiveDateChange,
  onRequestReasonChange,
  onNoteChange,
  onPrevious,
  onSubmit,
  isLoading,
  error,
}: AAConfirmationStepProps) {
  const [agreed, setAgreed] = React.useState(false)
  const [studentConsulted, setStudentConsulted] = React.useState(false)
  const targetClassId = wizardData.selectedTargetClass?.classId

  const {
    data: targetClassDetail,
    isLoading: isLoadingSessions,
  } = useGetClassByIdQuery(targetClassId ?? 0, {
    skip: !targetClassId,
  })

  const sessionOptions = useMemo(
    () => targetClassDetail?.data.upcomingSessions ?? [],
    [targetClassDetail?.data.upcomingSessions]
  )
  const allowedDateSet = useMemo(() => {
    return new Set(sessionOptions.map((session) => session.date))
  }, [sessionOptions])
  const selectedSession = sessionOptions.find((session) => session.date === wizardData.effectiveDate)

  const isFormValid =
    wizardData.effectiveDate &&
    wizardData.requestReason.trim().length >= 10 &&
    agreed &&
    studentConsulted &&
    Boolean(selectedSession)

  // Validate effective date against class schedule
  const dateValidation = useMemo(() => {
    if (!wizardData.effectiveDate) return { valid: false, message: 'Vui lòng chọn ngày hiệu lực' }

    const parsedDate = parseISO(wizardData.effectiveDate)
    if (!isValid(parsedDate)) return { valid: false, message: 'Ngày không hợp lệ' }

    // Check if date is in the future
    if (isBefore(parsedDate, startOfDay(new Date()))) {
      return { valid: false, message: 'Ngày hiệu lực phải là ngày trong tương lai' }
    }

    if (!allowedDateSet.has(wizardData.effectiveDate)) {
      return { valid: false, message: 'Chỉ chọn ngày thuộc lịch học của lớp đích' }
    }

    return { valid: true, message: 'Ngày hợp lệ, học viên sẽ tham gia từ buổi này' }
  }, [allowedDateSet, wizardData.effectiveDate])

  
  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit()
    }
  }

  return (
    <div className="space-y-6">
      {/* Transfer Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-3">
          <h3 className="font-medium">THÔNG TIN YÊU CẦU CHUYỂN LỚP</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Info */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Học viên:</div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">{wizardData.selectedStudent?.fullName}</span></div>
                <div className="text-muted-foreground">
                  Mã: {wizardData.selectedStudent?.studentCode} • Email: {wizardData.selectedStudent?.email}
                </div>
              </div>
            </div>

            {/* Current Class */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lớp hiện tại:</div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">{wizardData.selectedCurrentClass?.classCode}</span></div>
                <div className="text-muted-foreground">
                  {wizardData.selectedCurrentClass?.className} • {wizardData.selectedCurrentClass?.branchName}
                </div>
              </div>
            </div>

            {/* Target Class */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lớp đích:</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="font-medium">{wizardData.selectedTargetClass?.classCode}</span>
                </div>
                <div className="text-muted-foreground">
                  {wizardData.selectedTargetClass?.className} • {wizardData.selectedTargetClass?.branchName}
                </div>
                <div className="text-muted-foreground">
                  {wizardData.selectedTargetClass?.scheduleDays} • {wizardData.selectedTargetClass?.scheduleTime}
                </div>
              </div>
            </div>

            {/* AA Info */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Người tạo:</div>
              <div className="text-sm">
                <span className="font-medium">Phòng Học vụ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Effective Date */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">NGÀY HIỆU LỰC (BUỔI CỤ THỂ)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !wizardData.effectiveDate && "text-muted-foreground"
              )}
              disabled={isLoadingSessions || sessionOptions.length === 0}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {wizardData.effectiveDate ? (
                format(new Date(wizardData.effectiveDate), "PPP", { locale: vi })
              ) : (
                isLoadingSessions ? 'Đang tải lịch học...' : 'Chọn buổi học'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={wizardData.effectiveDate ? new Date(wizardData.effectiveDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  onEffectiveDateChange(format(date, 'yyyy-MM-dd'))
                }
              }}
              disabled={(date) => {
                const iso = format(date, 'yyyy-MM-dd')
                return (
                  isBefore(date, startOfDay(new Date())) ||
                  !allowedDateSet.has(iso)
                )
              }}
              initialFocus
              locale={vi}
            />
          </PopoverContent>
        </Popover>

        {sessionOptions.length === 0 && !isLoadingSessions && (
          <p className="text-xs text-muted-foreground">
            Lớp chưa có lịch học khả dụng. Vui lòng kiểm tra lại trên hệ thống lịch.
          </p>
        )}

        {/* Date validation message */}
        {wizardData.effectiveDate && (
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
            Thời gian: {selectedSession.startTime} - {selectedSession.endTime} • Phòng {selectedSession.room || 'TBD'}
          </div>
        )}
      </div>

      {/* Request Reason */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">LÝ DO CHUYỂN LỚP</Label>
        <Textarea
          placeholder="Nhập lý do chuyển lớp (tối thiểu 10 ký tự)..."
          value={wizardData.requestReason}
          onChange={(e) => onRequestReasonChange(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between items-center">
          <div className={cn(
            "text-xs",
            wizardData.requestReason.trim().length >= 10 ? "text-green-700" : "text-muted-foreground"
          )}>
            {wizardData.requestReason.trim().length}/10 ký tự
            {wizardData.requestReason.trim().length >= 10 && ""}
          </div>
        </div>
      </div>

      {/* AA Notes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">GHI CHÚ</Label>
        <Textarea
          placeholder="Ghi chú cho Phòng Học vụ (tùy chọn)..."
          value={wizardData.note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Confirmations */}
      <div className="p-4 bg-muted/30 rounded-lg space-y-3">
        <h3 className="font-medium">XÁC NHẬN</h3>

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
              id="student-consulted"
              checked={studentConsulted}
              onCheckedChange={(checked) => setStudentConsulted(checked as boolean)}
            />
            <Label htmlFor="student-consulted" className="text-sm leading-relaxed">
              Tôi xác nhận đã trao đổi với học viên và học viên đồng ý với chuyển lớp
            </Label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <TransferErrorDisplay
          error={error}
          onRetry={() => {
            // Reset form and allow retry
          }}
          onContact={() => {
            window.location.href = 'mailto:academic@tms.edu.vn'
          }}
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
            'Tạo và duyệt ngay'
          )}
        </Button>
      </div>
    </div>
  )
}
