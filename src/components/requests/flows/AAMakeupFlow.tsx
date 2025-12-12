import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { AlertTriangle, Check, Loader2, MapPinIcon, VideoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  useCreateOnBehalfRequestMutation,
  useGetStudentMakeupOptionsQuery,
  useGetStudentMissedSessionsQuery,
  useGetStudentRequestConfigQuery,
  type StudentSearchResult
} from '@/store/services/studentRequestApi'
import { SelectStudentStep } from '@/app/academic/student-requests/components/steps/SelectStudentStep'
import {
  BaseFlowComponent,
  NoteInput,
  ReasonInput,
  Section,
  SelectionCard
} from '../UnifiedRequestFlow'
import {
  Validation,
  useErrorHandler,
  useSuccessHandler
} from '../utils'

const DEFAULT_MAKEUP_LOOKBACK_WEEKS = 2

// Helper function to get branch location based on modality
const getBranchLocation = (classInfo: { modality?: string; branchAddress?: string; branchName?: string }) => {
  if (classInfo.modality === 'ONLINE') {
    return classInfo.branchName ?? 'Online'
  }
  return classInfo.branchAddress ?? classInfo.branchName ?? 'Địa chỉ đang cập nhật'
}

interface AAMakeupFlowProps {
  onSuccess: () => void
}

export default function AAMakeupFlow({ onSuccess }: AAMakeupFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [excludeRequested, setExcludeRequested] = useState(true)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [showCapacityWarning, setShowCapacityWarning] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const { data: configResponse } = useGetStudentRequestConfigQuery()
  const makeupLookbackWeeks = configResponse?.data?.makeupLookbackWeeks ?? DEFAULT_MAKEUP_LOOKBACK_WEEKS
  const makeupWeeksLimit = configResponse?.data?.makeupWeeksLimit ?? 4
  const reasonMinLength = configResponse?.data?.reasonMinLength ?? 10

  const {
    data: missedResponse,
    isFetching: isLoadingMissed
  } = useGetStudentMissedSessionsQuery(
    selectedStudent
      ? { studentId: selectedStudent.id, weeksBack: makeupLookbackWeeks, excludeRequested }
      : skipToken,
    { skip: !selectedStudent }
  )

  const missedSessions = useMemo(() => {
    const sessions = missedResponse?.data?.missedSessions ?? missedResponse?.data?.sessions ?? []
    if (excludeRequested) {
      return sessions.filter((session) => !session.hasExistingMakeupRequest)
    }
    return sessions
  }, [missedResponse?.data, excludeRequested])

  const selectedMissedSession = useMemo(
    () => missedSessions.find((session) => session.sessionId === selectedMissedId),
    [missedSessions, selectedMissedId]
  )

  const {
    data: optionsResponse,
    isFetching: isLoadingStudentOptions
  } = useGetStudentMakeupOptionsQuery(
    selectedStudent && selectedMissedId
      ? { studentId: selectedStudent.id, targetSessionId: selectedMissedId }
      : skipToken,
    { skip: !selectedStudent || !selectedMissedId }
  )

  const makeupOptions = useMemo(() => optionsResponse?.data?.makeupOptions ?? [], [optionsResponse?.data?.makeupOptions])
  const selectedMakeupOption = useMemo(
    () => makeupOptions.find((option) => option.sessionId === selectedMakeupId),
    [makeupOptions, selectedMakeupId]
  )

  const [createOnBehalf, { isLoading: isCreating }] = useCreateOnBehalfRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  useEffect(() => {
    setSelectedMissedId(null)
    setSelectedMakeupId(null)
    setReason('')
    setNote('')
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedMissedSession) {
      setSelectedMakeupId(null)
    }
  }, [selectedMissedSession])

  const handleReset = useCallback(() => {
    setSelectedMissedId(null)
    setSelectedMakeupId(null)
    setReason('')
    setNote('')
  }, [])

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    handleReset()
    setCurrentStep(2) // Auto advance to next step
  }

  const handleNext = () => {
    if (currentStep === 2 && selectedMissedSession) setCurrentStep(3)
    if (currentStep === 3 && selectedMakeupOption) setCurrentStep(4)
  }

  const handleBack = () => {
    if (currentStep === 4) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(2)
      setSelectedMakeupId(null)
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setSelectedStudent(null)
    }
  }

  const handleSubmit = async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      handleError(new Error(reasonValidationError))
      return
    }

    if (!selectedStudent || !selectedMissedSession || !selectedMakeupOption) {
      handleError(new Error('Vui lòng chọn học viên, buổi vắng và buổi học bù phù hợp'))
      return
    }

    const isOverCapacity = !selectedMakeupOption.matchScore?.capacityOk
    if (isOverCapacity && !pendingSubmit) {
      setShowCapacityWarning(true)
      return
    }

    setShowCapacityWarning(false)
    setPendingSubmit(false)

    const currentClassId = selectedMissedSession.classInfo?.classId ?? selectedMissedSession.classInfo?.id ?? null
    if (!currentClassId) {
      handleError(new Error('Không thể xác định lớp của buổi đã chọn'))
      return
    }

    try {
      await createOnBehalf({
        requestType: 'MAKEUP',
        studentId: selectedStudent.id,
        currentClassId,
        targetSessionId: selectedMissedSession.sessionId,
        makeupSessionId: selectedMakeupOption.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  const handleConfirmOverride = () => {
    setPendingSubmit(true)
    setShowCapacityWarning(false)
    handleSubmit()
  }

  const step1Complete = !!selectedStudent
  const step2Complete = !!(selectedStudent && selectedMissedSession)
  const step3Complete = !!(selectedStudent && selectedMissedSession && selectedMakeupOption)
  const step4Complete = !!(step3Complete && reason.trim().length >= reasonMinLength)

  const steps = [
    {
      id: 1,
      title: 'Chọn học viên',
      description: 'Tìm kiếm học viên cần xử lý',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn buổi đã vắng',
      description: `Buổi vắng trong ${makeupLookbackWeeks} tuần gần nhất`,
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Chọn buổi học bù',
      description: 'Gợi ý buổi học phù hợp',
      isComplete: step3Complete,
      isAvailable: step2Complete
    },
    {
      id: 4,
      title: 'Lý do học bù',
      description: 'Điền lý do và ghi chú',
      isComplete: step4Complete,
      isAvailable: step3Complete
    }
  ]

  if (currentStep === 1) {
    return (
      <SelectStudentStep
        onSelect={handleSelectStudent}
        steps={steps}
        currentStep={currentStep}
      />
    )
  }

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={(currentStep === 2 && !selectedMissedSession) || (currentStep === 3 && !selectedMakeupOption)}
      isSubmitDisabled={!step4Complete}
      isSubmitting={isCreating}
      submitLabel="Xử lý yêu cầu"
    >

      {currentStep === 2 && selectedStudent && (
        <Section>
          {/* Policy Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 mb-3">
            <div className="flex gap-2">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Chính sách học bù</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
                  <li>• Hiển thị buổi vắng trong <strong>{makeupLookbackWeeks} tuần</strong> gần nhất</li>
                  <li>• Phải nộp yêu cầu trong vòng <strong>{makeupWeeksLimit} tuần</strong> sau khi vắng</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="min-h-[280px] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{missedSessions.length} buổi vắng tìm thấy</p>
              <Button
                variant={excludeRequested ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExcludeRequested((prev) => !prev)}
              >
                {excludeRequested ? 'Ẩn đã gửi' : 'Hiện tất cả'}
              </Button>
            </div>

            {!isLoadingMissed && missedSessions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Không có buổi vắng hợp lệ trong {makeupLookbackWeeks} tuần gần nhất (chỉ chấp nhận request trong vòng {makeupWeeksLimit} tuần)
              </div>
            ) : (
              <div className="space-y-2">
                {missedSessions.map((session) => (
                  <SelectionCard
                    key={session.sessionId}
                    item={session}
                    isSelected={selectedMissedId === session.sessionId}
                    onSelect={() => setSelectedMissedId(session.sessionId)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {format(parseISO(session.date), 'EEEE, dd/MM', { locale: vi })} · {session.classInfo.classCode || session.classInfo.code}
                          </p>
                          <Badge variant={session.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                            {session.classInfo.modality === 'ONLINE' ? (
                              <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                            ) : (
                              <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Buổi {session.subjectSessionNumber}: {session.subjectSessionTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.timeSlotInfo.startTime} - {session.timeSlotInfo.endTime} · {getBranchLocation(session.classInfo)}
                        </p>
                        {session.classInfo.resourceName && (
                          <p className="text-xs text-muted-foreground">
                            {session.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {session.classInfo.resourceName}
                          </p>
                        )}
                      </div>
                      <Badge variant={session.isExcusedAbsence ? 'success' : 'warning'} className="shrink-0">
                        {session.isExcusedAbsence ? 'Có phép' : 'Không phép'}
                      </Badge>
                    </div>
                  </SelectionCard>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {currentStep === 3 && selectedStudent && selectedMissedSession && (
        <Section>
          <div className="min-h-80 space-y-4">
            {/* Hiển thị buổi đã vắng */}
            <div className="rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs text-muted-foreground mb-1">Buổi đã vắng:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {selectedMissedSession.classInfo.classCode || selectedMissedSession.classInfo.code}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(selectedMissedSession.date), 'EEE, dd/MM', { locale: vi })}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-medium">
                  Buổi {selectedMissedSession.subjectSessionNumber}: {selectedMissedSession.subjectSessionTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{makeupOptions.length} buổi học bù phù hợp</p>
              {isLoadingStudentOptions && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải gợi ý
                </div>
              )}
            </div>

            {!isLoadingStudentOptions && makeupOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Chưa có buổi học bù phù hợp
              </div>
            ) : (
              <div className="space-y-2">
                {makeupOptions.map((option) => {
                  const isOverCapacity = !option.matchScore?.capacityOk
                  return (
                    <SelectionCard
                      key={option.sessionId}
                      item={option}
                      isSelected={selectedMakeupId === option.sessionId}
                      onSelect={() => setSelectedMakeupId(option.sessionId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {format(parseISO(option.date), 'EEEE, dd/MM', { locale: vi })} · {option.classInfo.classCode || option.classInfo.code}
                            </p>
                            <Badge variant={option.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                              {option.classInfo.modality === 'ONLINE' ? (
                                <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                              ) : (
                                <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Buổi {option.subjectSessionNumber}: {option.subjectSessionTitle}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {option.timeSlotInfo.startTime} - {option.timeSlotInfo.endTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getBranchLocation(option.classInfo)}
                          </p>
                          {option.classInfo.resourceName && (
                            <p className="text-xs text-muted-foreground">
                              {option.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {option.classInfo.resourceName}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {isOverCapacity ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Đầy ({option.maxCapacity}/{option.maxCapacity})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                                Còn {option.availableSlots} chỗ
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </SelectionCard>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 4: Session info display + Reason/Note input */}
      {currentStep === 4 && selectedMissedSession && selectedMakeupOption && (
        <Section>
          <div className="min-h-80 space-y-4">
            {/* Thông tin buổi vắng và buổi học bù */}
            <div className="rounded-lg bg-muted/30 p-3 border space-y-3">
              {/* Buổi vắng */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Buổi đã vắng:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {selectedMissedSession.classInfo.classCode || selectedMissedSession.classInfo.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(selectedMissedSession.date), 'EEE, dd/MM', { locale: vi })}
                    </span>
                    <Badge variant={selectedMissedSession.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                      {selectedMissedSession.classInfo.modality === 'ONLINE' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium">
                    Buổi {selectedMissedSession.subjectSessionNumber}: {selectedMissedSession.subjectSessionTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMissedSession.timeSlotInfo.startTime} - {selectedMissedSession.timeSlotInfo.endTime} · {getBranchLocation(selectedMissedSession.classInfo)}
                  </p>
                  {selectedMissedSession.classInfo.resourceName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMissedSession.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {selectedMissedSession.classInfo.resourceName}
                    </p>
                  )}
                </div>
              </div>

              {/* Buổi học bù */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground mb-1">Buổi học bù đã chọn:</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => setCurrentStep(3)}>Đổi buổi</Button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{selectedMakeupOption.classInfo.classCode || selectedMakeupOption.classInfo.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(selectedMakeupOption.date), 'EEE dd/MM', { locale: vi })}
                    </span>
                    <Badge variant={selectedMakeupOption.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                      {selectedMakeupOption.classInfo.modality === 'ONLINE' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium">
                    Buổi {selectedMakeupOption.subjectSessionNumber}: {selectedMakeupOption.subjectSessionTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMakeupOption.timeSlotInfo.startTime}-{selectedMakeupOption.timeSlotInfo.endTime} · {getBranchLocation(selectedMakeupOption.classInfo)}
                  </p>
                  {selectedMakeupOption.classInfo.resourceName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {selectedMakeupOption.classInfo.resourceName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reason and Note inputs */}
            <div className="space-y-3">
              <ReasonInput
                value={reason}
                onChange={setReason}
                placeholder="Mô tả lý do học viên cần học bù (tối thiểu 10 ký tự)"
                error={Validation.reason(reason)}
              />

              <NoteInput
                value={note}
                onChange={setNote}
                placeholder="Ghi chú thêm về yêu cầu học bù..."
              />
            </div>
          </div>
        </Section>
      )}

      {showCapacityWarning && selectedMakeupOption && (
        <AlertDialog open={showCapacityWarning} onOpenChange={setShowCapacityWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cảnh báo: Lớp đã đầy
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <p className="text-foreground">Buổi học bù bạn chọn đã đạt giới hạn học viên:</p>

                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buổi học:</span>
                      <span className="font-medium text-foreground">
                        {format(parseISO(selectedMakeupOption.date), 'dd/MM/yyyy', { locale: vi })}{' '}
                        {selectedMakeupOption.timeSlotInfo?.startTime} - {selectedMakeupOption.timeSlotInfo?.endTime}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lớp:</span>
                      <span className="font-medium text-foreground">{selectedMakeupOption.classInfo.classCode}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chi nhánh:</span>
                      <span className="font-medium text-foreground">{selectedMakeupOption.classInfo.branchName}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sức chứa:</span>
                      <span className="font-semibold text-amber-600">
                        {selectedMakeupOption.maxCapacity - selectedMakeupOption.availableSlots}/{selectedMakeupOption.maxCapacity}{' '}
                        <Badge variant="destructive" className="ml-2">
                          ĐẦY
                        </Badge>
                      </span>
                    </div>
                  </div>

                  <p className="text-amber-700 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    Bạn có chắc muốn override capacity và tạo yêu cầu học bù không?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowCapacityWarning(false)
                  setPendingSubmit(false)
                }}
              >
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmOverride} className="bg-amber-600 hover:bg-amber-700">
                <Check className="mr-2 h-4 w-4" />
                Xác nhận override & Xử lý
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </BaseFlowComponent>
  )
}

