import { useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Info, MapPin, Clock, AlertTriangle, Check, Users } from 'lucide-react'
import {
  useGetAcademicTransferEligibilityQuery,
  useGetAcademicTransferOptionsQuery,
  useSubmitTransferOnBehalfMutation,
  type StudentSearchResult,
  type TransferEligibility,
  type TransferOption
} from '@/store/services/studentRequestApi'
import { SelectStudentStep } from '@/app/academic/student-requests/components/steps/SelectStudentStep'
import {
  Section,
  ReasonInput,
  NoteInput,
  BaseFlowComponent
} from '../UnifiedRequestFlow'
import HorizontalTimeline from './HorizontalTimeline'
import {
  getModalityLabel,
  getCapacityText,
  getContentGapText,
  getChangeIndicators,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../utils'
import { cn } from '@/lib/utils'
import type { SessionModality } from '@/store/services/studentRequestApi'
import { useAuth } from '@/hooks/useAuth'


interface AATransferFlowProps {
  onSuccess: () => void
}

export default function AATransferFlow({ onSuccess }: AATransferFlowProps) {
  // Auth context
  const { selectedBranchId } = useAuth()

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedCurrentClass, setSelectedCurrentClass] = useState<TransferEligibility | null>(null)
  const [selectedTargetClass, setSelectedTargetClass] = useState<TransferOption | null>(null)
  const [targetModality, setTargetModality] = useState<SessionModality | undefined>()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [requestReason, setRequestReason] = useState('')
  const [note, setNote] = useState('')

  // State for capacity override confirmation dialog (shown on submit if target class is full)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  const {
    data: eligibilityResponse,
    isFetching: isLoadingEligibility,
  } = useGetAcademicTransferEligibilityQuery(
    selectedStudent ? { studentId: selectedStudent.id } : skipToken,
    { skip: !selectedStudent }
  )

  const eligibilityData = eligibilityResponse?.data
  const eligibilityOptions = eligibilityData?.currentClasses ?? eligibilityData?.currentEnrollments ?? []

  const {
    data: optionsResponse,
    isFetching: isLoadingOptions,
  } = useGetAcademicTransferOptionsQuery(
    {
      currentClassId: selectedCurrentClass?.classId ?? 0,
      targetBranchId: selectedBranchId ?? undefined,
      targetModality,
      scheduleOnly: false
    },
    { skip: !selectedCurrentClass || !selectedBranchId }
  )

  const transferOptions = optionsResponse?.data?.availableClasses ?? []

  // Find selected session from timeline
  const selectedSession = selectedSessionId && selectedTargetClass?.allSessions
    ? selectedTargetClass.allSessions.find(s => s.sessionId === selectedSessionId)
    : null

  const effectiveDate = selectedSession?.date ?? ''

  const [submitTransfer, { isLoading: isSubmitting }] = useSubmitTransferOnBehalfMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setSelectedCurrentClass(null)
    setSelectedTargetClass(null)
    setTargetModality(undefined)
    setSelectedSessionId(null)
    setRequestReason('')
    setNote('')
    setCurrentStep(2) // Auto advance to next step
  }

  const handleCancelStudentSelection = () => {
    // This will close the modal via onSuccess callback
    onSuccess()
  }

  const handleNext = () => {
    if (currentStep === 2 && selectedCurrentClass) {
      setCurrentStep(3)
    } else if (currentStep === 3 && selectedTargetClass) {
      setCurrentStep(4)
    }
  }

  const handleBack = () => {
    if (currentStep === 4) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setSelectedStudent(null)
    }
  }

  const handleSubmit = async () => {
    const reasonValidationError = Validation.reason(requestReason)
    if (reasonValidationError) {
      handleError(new Error(reasonValidationError))
      return
    }

    if (!selectedStudent || !selectedCurrentClass || !selectedTargetClass) {
      handleError(new Error('Vui lòng chọn học viên, lớp hiện tại và lớp mục tiêu'))
      return
    }

    if (!selectedSessionId || !selectedSession) {
      handleError(new Error('Vui lòng chọn buổi học bắt đầu'))
      return
    }

    // Check if target class is full - show confirmation dialog
    const isTargetFull = (selectedTargetClass.availableSlots ?? 0) <= 0
    if (isTargetFull && !showOverrideDialog) {
      setShowOverrideDialog(true)
      return
    }

    await executeSubmit()
  }

  const executeSubmit = async () => {
    if (!selectedStudent || !selectedCurrentClass || !selectedTargetClass || !selectedSessionId || !effectiveDate) {
      console.error('Missing required fields for submit')
      return
    }

    const isTargetFull = (selectedTargetClass.availableSlots ?? 0) <= 0

    try {
      await submitTransfer({
        studentId: selectedStudent.id,
        currentClassId: selectedCurrentClass.classId,
        targetClassId: selectedTargetClass.classId,
        effectiveDate,
        sessionId: selectedSessionId,
        requestReason: requestReason.trim(),
        note: note.trim() || undefined,
        // Capacity override fields (AA only)
        capacityOverride: isTargetFull ? true : undefined,
        overrideReason: isTargetFull ? overrideReason.trim() : undefined,
      }).unwrap()

      setShowOverrideDialog(false)
      setOverrideReason('')
      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }


  // Step states
  const step1Complete = !!selectedStudent
  const step2Complete = !!(selectedStudent && selectedCurrentClass)
  const step3Complete = !!(selectedStudent && selectedCurrentClass && selectedTargetClass)
  const step4Complete = !!(selectedStudent && selectedCurrentClass && selectedTargetClass && effectiveDate && requestReason.trim().length >= 10)

  const steps = [
    {
      id: 1,
      title: 'Chọn học viên',
      description: 'Tìm kiếm học viên để chuyển lớp',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn lớp hiện tại',
      description: 'Chọn lớp học hiện tại của học viên',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Chọn lớp mục tiêu',
      description: 'Chọn lớp mới phù hợp',
      isComplete: step3Complete,
      isAvailable: step2Complete
    },
    {
      id: 4,
      title: 'Xác nhận chuyển lớp',
      description: 'Chọn buổi bắt đầu và xác nhận',
      isComplete: step4Complete,
      isAvailable: step3Complete
    }
  ]

  // Step 1 uses SelectStudentStep component outside BaseFlowComponent
  if (currentStep === 1) {
    return (
      <SelectStudentStep
        onSelect={handleSelectStudent}
        onCancel={handleCancelStudentSelection}
        steps={steps}
        currentStep={currentStep}
      />
    )
  }

  return (
    <>
      <BaseFlowComponent
        steps={steps}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isNextDisabled={
          (currentStep === 2 && !selectedCurrentClass) ||
          (currentStep === 3 && !selectedTargetClass)
        }
        isSubmitDisabled={!step4Complete}
        isSubmitting={isSubmitting}
        submitLabel="Xử lý yêu cầu"
      >

        {/* Step 2: Current class selection */}
        {currentStep === 2 && selectedStudent && (
          <Section>
            <div className="min-h-[280px] space-y-4">
              {/* Policy Info - AA View with Statistics */}
              {eligibilityData && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">Quy định chuyển lớp:</p>
                      </div>

                      <ul className="space-y-0.5 text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>Mỗi môn học: Tối đa <span className="font-medium text-foreground">{eligibilityData.policyInfo?.maxTransfersPerCourse ?? 1} lần chuyển</span></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>AA có thể <span className="font-medium text-foreground">override sức chứa lớp</span> khi lớp mục tiêu đã đầy</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>Hỗ trợ chuyển <span className="font-medium text-foreground">linh hoạt</span>: cơ sở, hình thức, lịch học</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!isLoadingEligibility && eligibilityOptions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Học viên không có lớp nào đủ điều kiện chuyển
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Chọn lớp hiện tại của học viên:</p>
                  {eligibilityOptions.map((cls: TransferEligibility) => {
                    const quotaUsed = cls.transferQuota.used >= cls.transferQuota.limit
                    const hasPending = cls.hasPendingTransfer
                    const isDisabled = quotaUsed || hasPending

                    return (
                      <div
                        key={cls.enrollmentId}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedCurrentClass(cls)
                            setSelectedTargetClass(null)
                          }
                        }}
                        className={cn(
                          'block rounded-lg border p-3 transition',
                          isDisabled
                            ? 'cursor-not-allowed opacity-60 bg-muted/20'
                            : 'cursor-pointer hover:border-primary/50 hover:bg-muted/30',
                          selectedCurrentClass?.enrollmentId === cls.enrollmentId && !isDisabled && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{cls.classCode}</span>
                              <Badge variant="secondary" className="text-xs font-normal">
                                {cls.subjectName}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{cls.branchName}</span>
                              <span>·</span>
                              <span>{cls.modality && getModalityLabel(cls.modality)}</span>
                            </div>
                            {/* Time slots - each on separate line */}
                            {cls.scheduleTime && (
                              <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                  {cls.scheduleTime.split(', ').map((slot: string, idx: number) => (
                                    <span key={idx}>{slot}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {/* Status Badge */}
                            {hasPending ? (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Chờ duyệt
                              </Badge>
                            ) : quotaUsed ? (
                              <Badge variant="outline" className="text-xs text-rose-600 border-rose-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Hết quota
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                                <Check className="h-3 w-3 mr-1" />
                                Còn quota
                              </Badge>
                            )}

                            {/* Quota Display */}
                            <span className={cn(
                              "text-xs font-medium tabular-nums",
                              quotaUsed ? "text-rose-600" : "text-muted-foreground"
                            )}>
                              {cls.transferQuota.used}/{cls.transferQuota.limit} lượt
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Step 3: Target class selection - 2 column layout */}
        {currentStep === 3 && selectedCurrentClass && (
          <Section>
            <div className="min-h-[320px]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column - Current Class (Fixed) */}
                <div className="lg:col-span-4">
                  <div className="sticky top-0">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Lớp hiện tại</h4>
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{selectedCurrentClass.classCode}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {selectedCurrentClass.subjectName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{selectedCurrentClass.branchName}</span>
                        <span>·</span>
                        <span>{selectedCurrentClass.modality && getModalityLabel(selectedCurrentClass.modality)}</span>
                      </div>
                      {/* Time slots */}
                      {selectedCurrentClass.scheduleTime && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            {selectedCurrentClass.scheduleTime.split(', ').map((slot: string, idx: number) => (
                              <span key={idx}>{slot}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Quota */}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Quota chuyển lớp</span>
                        <Badge variant={selectedCurrentClass.canTransfer ? "secondary" : "outline"}
                          className={cn("text-xs",
                            selectedCurrentClass.canTransfer
                              ? "bg-emerald-100 text-emerald-700"
                              : "text-rose-600 border-rose-300"
                          )}>
                          {selectedCurrentClass.transferQuota.used}/{selectedCurrentClass.transferQuota.limit}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Target Classes (Scrollable) */}
                <div className="lg:col-span-8 space-y-3">
                  {/* Filter */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground shrink-0">Lọc hình thức:</label>
                    <Select
                      value={targetModality ?? 'all'}
                      onValueChange={(value) => setTargetModality(value === 'all' ? undefined : value as SessionModality)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="OFFLINE">Tại trung tâm</SelectItem>
                        <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target class list */}
                  <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
                    {!isLoadingOptions && transferOptions.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                        Không có lớp mục tiêu phù hợp
                      </div>
                    ) : (
                      transferOptions.map((option: TransferOption) => {
                        const gapText = getContentGapText(option.contentGapAnalysis)
                        const { hasBranchChange, hasModalityChange } = getChangeIndicators(option.changes)
                        const isScheduled = option.classStatus === 'SCHEDULED'
                        const startDate = option.startDate ? new Date(option.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
                        const isFull = (option.availableSlots ?? 0) <= 0

                        const handleSelectClass = () => {
                          // Direct selection for all classes (override confirmation happens at submit)
                          setSelectedTargetClass(option)
                          setSelectedSessionId(null) // Reset session selection when changing target class
                        }

                        return (
                          <div
                            key={option.classId}
                            onClick={handleSelectClass}
                            className={cn(
                              'block cursor-pointer rounded-lg border px-3 py-2.5 transition',
                              isFull
                                ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300 hover:bg-rose-50'
                                : 'hover:border-primary/50 hover:bg-muted/30',
                              selectedTargetClass?.classId === option.classId && (isFull
                                ? 'border-rose-400 bg-rose-100/50 ring-1 ring-rose-300'
                                : 'border-primary bg-primary/5')
                            )}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={cn(
                                    "text-xs shrink-0",
                                    isFull && "border-rose-300 text-rose-700"
                                  )}>
                                    {option.classCode}
                                  </Badge>
                                  {isFull && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Users className="h-3 w-3 mr-1" />
                                      Đầy
                                    </Badge>
                                  )}
                                  {isScheduled && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                      Sắp khai giảng
                                    </Badge>
                                  )}
                                </div>
                                <span className={cn(
                                  'text-xs font-medium shrink-0 tabular-nums',
                                  isFull ? 'text-rose-600' : 'text-emerald-600'
                                )}>
                                  {getCapacityText(option.enrolledCount, option.maxCapacity)}
                                </span>
                              </div>

                              {/* Branch + Modality */}
                              <div className={cn(
                                "flex items-center gap-1.5 text-xs",
                                isFull && "text-muted-foreground/70"
                              )}>
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                {hasModalityChange && <span className="text-blue-600 font-medium">→</span>}
                                <span className={cn(hasModalityChange && "text-blue-600 font-medium")}>
                                  {getModalityLabel(option.modality)}
                                </span>
                              </div>

                              {/* Time slots */}
                              {option.scheduleTime && (
                                <div className={cn(
                                  "flex items-start gap-1 text-xs text-muted-foreground",
                                  isFull && "text-muted-foreground/70"
                                )}>
                                  <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                                  <div className="flex flex-col gap-0.5">
                                    {option.scheduleTime.split(', ').map((slot: string, idx: number) => (
                                      <span key={idx}>{slot}</span>
                                    ))}
                                    {isScheduled && startDate && (
                                      <span className="text-blue-600">Bắt đầu {startDate}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Full Class Warning */}
                              {isFull && (
                                <div className="flex items-start gap-1.5 text-xs text-rose-700 bg-rose-100 border border-rose-200 rounded px-2 py-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>Lớp đã đầy, cần xác nhận override</span>
                                </div>
                              )}

                              {/* Content Gap Warning */}
                              {gapText && !isFull && (
                                <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{gapText}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Step 4: Session selection & confirmation */}
        {currentStep === 4 && selectedTargetClass && selectedCurrentClass && (
          <Section>
            <div className="space-y-4">
              {/* Horizontal Timeline */}
              {selectedCurrentClass.allSessions && selectedTargetClass.allSessions && (
                <HorizontalTimeline
                  currentClassSessions={selectedCurrentClass.allSessions}
                  targetClassSessions={selectedTargetClass.allSessions}
                  currentClassCode={selectedCurrentClass.classCode}
                  targetClassCode={selectedTargetClass.classCode}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  currentSubjectId={selectedCurrentClass.subjectId}
                  targetSubjectId={selectedTargetClass.subjectId}
                />
              )}

              <ReasonInput
                value={requestReason}
                onChange={setRequestReason}
                placeholder="Lý do yêu cầu chuyển lớp..."
                error={null}
              />

              <NoteInput
                value={note}
                onChange={setNote}
                placeholder="Ghi chú thêm về yêu cầu chuyển lớp..."
              />
            </div>
          </Section>
        )}
      </BaseFlowComponent>

      {/* Capacity Override Confirmation Dialog (shown at submit time) */}
      <AlertDialog
        open={showOverrideDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowOverrideDialog(false)
            setOverrideReason('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận Override sức chứa lớp
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Lớp <span className="font-semibold text-foreground">{selectedTargetClass?.classCode}</span> hiện
                  đã đạt sức chứa tối đa ({selectedTargetClass?.enrolledCount}/{selectedTargetClass?.maxCapacity} học viên).
                </p>
                <p>
                  Bạn đang thực hiện <strong className="text-rose-600">override</strong> giới hạn sức chứa với tư cách Giáo vụ.
                  Vui lòng cung cấp lý do để ghi nhận vào hệ thống.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Lý do override *</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm 
                               placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Nhập lý do cần override sức chứa lớp..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={overrideReason.trim().length < 10}
              onClick={executeSubmit}
            >
              Xác nhận Override và Xử lý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}