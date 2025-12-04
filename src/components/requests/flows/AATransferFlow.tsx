import { useState, useCallback, useMemo } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { cn } from '@/lib/utils'
import { ArrowRightIcon } from 'lucide-react'
import {
  useSearchStudentsQuery,
  useGetAcademicTransferEligibilityQuery,
  useGetAcademicTransferOptionsQuery,
  useSubmitTransferOnBehalfMutation,
  useGetBranchesQuery,
  type StudentSearchResult,
  type TransferEligibility,
  type TransferOption
} from '@/store/services/studentRequestApi'
import {
  Section,
  ReasonInput,
  NoteInput,
  BaseFlowComponent,
  SelectionCard
} from '../UnifiedRequestFlow'
import {
  useDebouncedValue,
  getModalityLabel,
  getCapacityText,
  getContentGapText,
  getChangeIndicators,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../utils'
import type { SessionModality } from '@/store/services/studentRequestApi'


interface AATransferFlowProps {
  onSuccess: () => void
}

export default function AATransferFlow({ onSuccess }: AATransferFlowProps) {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedCurrentClass, setSelectedCurrentClass] = useState<TransferEligibility | null>(null)
  const [selectedTargetClass, setSelectedTargetClass] = useState<TransferOption | null>(null)
  const [targetBranchId, setTargetBranchId] = useState<number | undefined>()
  const [targetModality, setTargetModality] = useState<SessionModality | undefined>()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null)
  const [requestReason, setRequestReason] = useState('')
  const [note, setNote] = useState('')

  const debouncedStudentSearch = useDebouncedValue(studentSearch)
  const trimmedSearch = debouncedStudentSearch.trim()
  const shouldSearchStudents = trimmedSearch.length >= 2

  const studentQueryResult = useSearchStudentsQuery(
    shouldSearchStudents
      ? { search: trimmedSearch, size: 5, page: 0 }
      : skipToken,
    { skip: !shouldSearchStudents }
  )

  const studentOptions = studentQueryResult.data?.data?.content ?? []
  const isSearchingStudents = shouldSearchStudents && studentQueryResult.isFetching

  const {
    data: eligibilityResponse,
    isFetching: isLoadingEligibility,
  } = useGetAcademicTransferEligibilityQuery(
    selectedStudent ? { studentId: selectedStudent.id } : skipToken,
    { skip: !selectedStudent }
  )

  const eligibilityData = eligibilityResponse?.data
  const eligibilityOptions = eligibilityData?.currentClasses ?? eligibilityData?.currentEnrollments ?? []

  // Fetch all branches independently for filter dropdown
  const { data: branchesResponse } = useGetBranchesQuery()
  const branches = branchesResponse?.data ?? []

  const {
    data: optionsResponse,
    isFetching: isLoadingOptions,
  } = useGetAcademicTransferOptionsQuery(
    {
      currentClassId: selectedCurrentClass?.classId ?? 0,
      targetBranchId,
      targetModality,
      scheduleOnly: false
    },
    { skip: !selectedCurrentClass }
  )

  const transferOptions = optionsResponse?.data?.availableClasses ?? []

  // Group upcoming sessions by week
  const upcomingSessions = useMemo(() => selectedTargetClass?.upcomingSessions ?? [], [selectedTargetClass])
  const sessionsByWeek = useMemo(() => {
    if (upcomingSessions.length === 0) return []

    const grouped: Array<{ weekStart: Date; weekEnd: Date; sessions: typeof upcomingSessions }> = []
    let currentWeek: typeof upcomingSessions = []
    let weekStart: Date | null = null

    upcomingSessions.forEach((session, index) => {
      const sessionDate = parseISO(session.date)

      if (!weekStart) {
        weekStart = sessionDate
      }

      const daysSinceWeekStart = Math.floor((sessionDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceWeekStart < 7) {
        currentWeek.push(session)
      } else {
        grouped.push({
          weekStart: weekStart,
          weekEnd: addDays(weekStart, 6),
          sessions: currentWeek
        })
        weekStart = sessionDate
        currentWeek = [session]
      }

      if (index === upcomingSessions.length - 1 && currentWeek.length > 0) {
        grouped.push({
          weekStart: weekStart!,
          weekEnd: addDays(weekStart!, 6),
          sessions: currentWeek
        })
      }
    })

    return grouped
  }, [upcomingSessions])

  const currentWeek = sessionsByWeek[weekOffset]
  const selectedSession = selectedSessionIndex !== null && currentWeek
    ? currentWeek.sessions[selectedSessionIndex]
    : null
  const effectiveDate = selectedSession?.date ?? ''

  const weekRangeLabel = currentWeek
    ? `${format(currentWeek.weekStart, 'dd/MM', { locale: vi })} - ${format(currentWeek.weekEnd, 'dd/MM', { locale: vi })}`
    : ''

  const [submitTransfer, { isLoading: isSubmitting }] = useSubmitTransferOnBehalfMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setStudentSearch(student.fullName)
    setSelectedCurrentClass(null)
    setSelectedTargetClass(null)
    setTargetBranchId(undefined)
    setTargetModality(undefined)
    setSelectedSessionIndex(null)
    setRequestReason('')
    setNote('')
  }

  const handleChangeWeek = useCallback((direction: 'prev' | 'next') => {
    setWeekOffset(prev => {
      const newOffset = direction === 'next' ? prev + 1 : prev - 1
      return Math.max(0, Math.min(newOffset, sessionsByWeek.length - 1))
    })
    setSelectedSessionIndex(null)
  }, [sessionsByWeek.length])

  const handleNext = () => {
    if (currentStep === 1 && selectedStudent) setCurrentStep(2)
    else if (currentStep === 2 && selectedCurrentClass) setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
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

    if (!selectedSession) {
      handleError(new Error('Vui lòng chọn buổi học bắt đầu'))
      return
    }

    try {
      await submitTransfer({
        studentId: selectedStudent.id,
        currentClassId: selectedCurrentClass.classId,
        targetClassId: selectedTargetClass.classId,
        effectiveDate,
        sessionId: selectedSession.sessionId,
        requestReason: requestReason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }


  // Step states
  const step1Complete = !!selectedStudent
  const step2Complete = !!(selectedStudent && selectedCurrentClass)
  const step3Complete = !!(selectedStudent && selectedCurrentClass && selectedTargetClass && effectiveDate && requestReason.trim().length >= 10)

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
      description: 'Chọn lớp mới và ngày hiệu lực',
      isComplete: step3Complete,
      isAvailable: step2Complete
    }
  ]

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={
        (currentStep === 1 && !selectedStudent) ||
        (currentStep === 2 && !selectedCurrentClass)
      }
      isSubmitDisabled={!step3Complete}
      isSubmitting={isSubmitting}
      submitLabel="Tạo yêu cầu"
    >
      {/* Step 1: Student selection */}
      {currentStep === 1 && (
        <Section>
          <div className="space-y-3">
            <Input
              placeholder="Nhập tên hoặc mã học viên (tối thiểu 2 ký tự)"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
            />
            {studentSearch.trim().length > 0 && studentOptions.length > 0 && !isSearchingStudents && (
              <div className="space-y-2">
                {studentOptions.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition hover:border-primary/50 hover:bg-muted/30",
                        selectedStudent?.id === student.id && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{student.fullName}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{student.studentCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{student.email}</p>
                    </button>
                  ))}
              </div>
            )}
            {selectedStudent && (
              <div className="border-t pt-3 mt-3">
                <div className="rounded-lg bg-muted/30 p-3 border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{selectedStudent.fullName}</span>
                    <span className="text-xs text-muted-foreground">{selectedStudent.studentCode}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 2: Current class selection */}
      {currentStep === 2 && selectedStudent && (
        <Section>
          <div className="space-y-3">
            {!isLoadingEligibility && eligibilityOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Học viên không có lớp nào đủ điều kiện chuyển
              </div>
            ) : (
              <div className="space-y-2">
                {eligibilityOptions.map((cls: TransferEligibility) => (
                  <SelectionCard
                    key={cls.enrollmentId}
                    item={cls}
                    isSelected={selectedCurrentClass?.enrollmentId === cls.enrollmentId}
                    onSelect={() => {
                      setSelectedCurrentClass(cls)
                      setSelectedTargetClass(null)
                    }}
                  >
                    <p className="font-medium">
                      {cls.classCode} · {cls.className}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cls.branchName} · {cls.modality && getModalityLabel(cls.modality)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quota chuyển: {cls.transferQuota.used}/{cls.transferQuota.limit}
                      {!cls.canTransfer && <span className="text-rose-600"> · Đã hết quota</span>}
                    </p>
                  </SelectionCard>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 3: Target class selection */}
      {currentStep === 3 && selectedCurrentClass && (
        <Section>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Chi nhánh mục tiêu</label>
                <select
                  value={targetBranchId ?? ''}
                  onChange={(e) => setTargetBranchId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hình thức học</label>
                <select
                  value={targetModality ?? ''}
                  onChange={(e) => setTargetModality(e.target.value as SessionModality | undefined)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tất cả hình thức</option>
                  <option value="OFFLINE">Tại trung tâm</option>
                  <option value="ONLINE">Trực tuyến</option>
                  <option value="HYBRID">Kết hợp</option>
                </select>
              </div>
            </div>

            {/* Target class options */}
            {!isLoadingOptions && transferOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Không có lớp mục tiêu phù hợp với bộ lọc hiện tại
              </div>
            ) : (
              <div className="space-y-2">
                {transferOptions.map((option: TransferOption) => {
                  const gapText = getContentGapText(option.contentGapAnalysis)
                  const { hasBranchChange, hasModalityChange } = getChangeIndicators(option.changes)
                  const isScheduled = option.classStatus === 'SCHEDULED'
                  const startDate = option.startDate ? new Date(option.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

                  return (
                    <SelectionCard
                      key={option.classId}
                      item={option}
                      isSelected={selectedTargetClass?.classId === option.classId}
                      onSelect={() => {
                        setSelectedTargetClass(option)
                        setWeekOffset(0)
                        setSelectedSessionIndex(null)
                      }}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {option.classCode} · {option.className}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {hasBranchChange && <span className="text-blue-600">→ </span>}
                          {option.branchName} · {hasModalityChange && <span className="text-blue-600">→ </span>}
                          {getModalityLabel(option.modality)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.scheduleInfo ?? option.scheduleDays + ' ' + option.scheduleTime} · {getCapacityText(option.availableSlots, option.maxCapacity)}
                          {isScheduled && startDate && <span> · Bắt đầu {startDate}</span>}
                        </p>
                        {gapText && (
                          <p className="text-xs text-amber-600">
                            {gapText}
                          </p>
                        )}
                      </div>
                    </SelectionCard>
                  )
                })}
              </div>
            )}

            {selectedTargetClass && (
              <div className="border-t pt-3 mt-3">
                <div className="rounded-lg bg-muted/30 p-3 border mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{selectedTargetClass.classCode}</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedTargetClass.branchName} · {getModalityLabel(selectedTargetClass.modality)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Session Selection with Week Navigation */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Buổi bắt đầu</label>

                    {upcomingSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center border rounded-lg">
                        Không có buổi học sắp tới
                      </p>
                    ) : (
                      <>
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-medium text-sm">{weekRangeLabel}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleChangeWeek('prev')} disabled={weekOffset === 0}>
                              <ArrowRightIcon className="h-3 w-3 rotate-180" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>Đầu</Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleChangeWeek('next')} disabled={weekOffset >= sessionsByWeek.length - 1}>
                              <ArrowRightIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Session List */}
                        <div className="space-y-2">
                          {currentWeek?.sessions.map((session, index) => {
                            const isActive = selectedSessionIndex === index
                            const sessionDate = parseISO(session.date)

                            return (
                              <SelectionCard
                                key={index}
                                item={session}
                                isSelected={isActive}
                                onSelect={() => setSelectedSessionIndex(index)}
                              >
                                <div className="flex-1 space-y-1">
                                  <p className="font-medium text-sm">
                                    Buổi {session.courseSessionNumber} · {format(sessionDate, 'dd/MM/yyyy (EEEE)', { locale: vi })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{session.courseSessionTitle}</p>
                                  <p className="text-xs text-muted-foreground">{session.timeSlot}</p>
                                </div>
                              </SelectionCard>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

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
              </div>
            )}
          </div>
        </Section>
      )}
    </BaseFlowComponent>
  )
}