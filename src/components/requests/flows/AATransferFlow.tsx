import { useState, useCallback, useMemo } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowRightIcon, Search, Loader2, UserX, CheckCircle2, Info, MapPin, Clock, AlertTriangle } from 'lucide-react'
import {
  useSearchStudentsQuery,
  useGetAcademicTransferEligibilityQuery,
  useGetAcademicTransferOptionsQuery,
  useSubmitTransferOnBehalfMutation,
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
import HorizontalTimeline from './HorizontalTimeline'
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

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedCurrentClass, setSelectedCurrentClass] = useState<TransferEligibility | null>(null)
  const [selectedTargetClass, setSelectedTargetClass] = useState<TransferOption | null>(null)
  const [targetModality, setTargetModality] = useState<SessionModality | undefined>()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [requestReason, setRequestReason] = useState('')
  const [note, setNote] = useState('')

  const debouncedStudentSearch = useDebouncedValue(studentSearch)
  const trimmedSearch = debouncedStudentSearch.trim()
  const shouldSearchStudents = trimmedSearch.length >= 2

  const studentQueryResult = useSearchStudentsQuery(
    shouldSearchStudents && selectedBranchId
      ? { 
          search: trimmedSearch, 
          size: 10, 
          page: 0,
          branchIds: [selectedBranchId]
        }
      : skipToken,
    { skip: !shouldSearchStudents || !selectedBranchId, refetchOnMountOrArgChange: true }
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
  
  // For new timeline: find selected session by ID
  const selectedTimelineSession = selectedSessionId && selectedTargetClass?.allSessions
    ? selectedTargetClass.allSessions.find(s => s.sessionId === selectedSessionId)
    : null
  
  const effectiveDate = selectedTimelineSession?.date ?? selectedSession?.date ?? ''

  const weekRangeLabel = currentWeek
    ? `${format(currentWeek.weekStart, 'dd/MM', { locale: vi })} - ${format(currentWeek.weekEnd, 'dd/MM', { locale: vi })}`
    : ''

  const [submitTransfer, { isLoading: isSubmitting }] = useSubmitTransferOnBehalfMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setStudentSearch('') // Clear search để hiển thị selected card
    setSelectedCurrentClass(null)
    setSelectedTargetClass(null)
    setTargetModality(undefined)
    setSelectedSessionIndex(null)
    setRequestReason('')
    setNote('')
  }

  const handleClearSelection = () => {
    setSelectedStudent(null)
    setStudentSearch('')
    setSelectedCurrentClass(null)
    setSelectedTargetClass(null)
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
    if (currentStep === 1 && selectedStudent) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedCurrentClass) {
      setCurrentStep(3)
    } else if (currentStep === 3 && selectedTargetClass) {
      setCurrentStep(4)
    }
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

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={
        (currentStep === 1 && !selectedStudent) ||
        (currentStep === 2 && !selectedCurrentClass) ||
        (currentStep === 3 && !selectedTargetClass)
      }
      isSubmitDisabled={!step4Complete}
      isSubmitting={isSubmitting}
      submitLabel="Xử lý yêu cầu"
    >
      {/* Step 1: Student selection */}
      {currentStep === 1 && (
        <Section>
          <div className="min-h-[280px] space-y-3">
            {selectedStudent ? (
              /* Hiển thị selected student card với button Chọn lại */
              <div className="rounded-lg bg-primary/5 border-2 border-primary p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-semibold text-base">{selectedStudent.fullName}</span>
                      <span className="text-sm text-muted-foreground">{selectedStudent.studentCode}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                      {selectedStudent.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 pl-7">
                      {selectedStudent.branchName} · {selectedStudent.activeEnrollments} lớp đang học
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    Chọn lại
                  </Button>
                </div>
              </div>
            ) : (
              /* Search input và dropdown */
              <>
                <Input
                  placeholder="Nhập tên hoặc mã học viên (tối thiểu 2 ký tự)"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  autoFocus
                />

                {/* Dropdown search results */}
                {shouldSearchStudents && !isSearchingStudents && studentOptions.length > 0 && (
                  <div className="rounded-lg border bg-card shadow-sm">
                    <div className="px-3 py-2 border-b bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        Tìm thấy {studentOptions.length} học viên
                      </p>
                    </div>
                    <div className="divide-y">
                      {studentOptions.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full px-3 py-2.5 text-left transition hover:bg-muted/50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{student.fullName}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{student.studentCode}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{student.email}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {isSearchingStudents && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Đang tìm kiếm...</p>
                  </div>
                )}

                {/* Initial state - chưa nhập gì */}
                {!isSearchingStudents && studentSearch.trim().length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Tìm kiếm học viên</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-60">
                      Nhập tên hoặc mã học viên vào ô tìm kiếm phía trên để bắt đầu
                    </p>
                  </div>
                )}

                {/* Nhập chưa đủ 2 ký tự */}
                {!isSearchingStudents && studentSearch.trim().length > 0 && studentSearch.trim().length < 2 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nhập thêm ít nhất {2 - studentSearch.trim().length} ký tự</p>
                  </div>
                )}

                {/* Không tìm thấy kết quả */}
                {shouldSearchStudents && !isSearchingStudents && studentOptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <UserX className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Không tìm thấy học viên</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-60">
                      Thử tìm kiếm với tên hoặc mã học viên khác
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>
      )}

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
                      {eligibilityData.policyInfo?.usedTransfers !== undefined && (
                        <Badge 
                          variant={
                            (eligibilityData.policyInfo.usedTransfers ?? 0) >= 3 
                              ? "destructive" 
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          Đã chuyển: {eligibilityData.policyInfo.usedTransfers} lần
                        </Badge>
                      )}
                    </div>
                    
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>Mỗi môn học: Tối đa <span className="font-medium text-foreground">{eligibilityData.policyInfo?.maxTransfersPerCourse ?? 1} lần chuyển</span></span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>AA có thể tạo yêu cầu <span className="font-medium text-foreground">vượt quota</span> (on-behalf)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>Hỗ trợ chuyển <span className="font-medium text-foreground">linh hoạt</span>: cơ sở, hình thức, lịch học</span>
                      </li>
                    </ul>
                    
                    {/* Warning for abuse pattern */}
                    {(eligibilityData.policyInfo?.usedTransfers ?? 0) >= 3 && (
                      <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Cảnh báo:</span> Học viên đã chuyển lớp nhiều lần. 
                          Xem xét lý do trước khi duyệt thêm.
                        </p>
                      </div>
                    )}
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
                  
                  return (
                    <label
                      key={cls.enrollmentId}
                      className={cn(
                        'block cursor-pointer rounded-lg border p-3 transition',
                        'hover:border-primary/50 hover:bg-muted/30',
                        selectedCurrentClass?.enrollmentId === cls.enrollmentId && 'border-primary bg-primary/5'
                      )}
                    >
                      <input
                        type="radio"
                        name="currentClass"
                        className="sr-only"
                        checked={selectedCurrentClass?.enrollmentId === cls.enrollmentId}
                        onChange={() => {
                          setSelectedCurrentClass(cls)
                          setSelectedTargetClass(null)
                        }}
                      />
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
                          {cls.scheduleInfo && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{cls.scheduleInfo}</span>
                            </p>
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
                              <CheckCircle2 className="h-3 w-3 mr-1" />
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
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 3: Target class selection (pure class selection only) */}
      {currentStep === 3 && selectedCurrentClass && (
        <Section>
          <div className="min-h-[280px] space-y-4">

            {/* Filters - Modality only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  const scheduleInfo = [option.scheduleDays, option.scheduleTime].filter(Boolean).join(' · ')

                  return (
                    <label
                      key={option.classId}
                      className={cn(
                        'block cursor-pointer rounded-lg border px-3 py-2.5 transition hover:border-primary/50 hover:bg-muted/30',
                        selectedTargetClass?.classId === option.classId && 'border-primary bg-primary/5'
                      )}
                    >
                      <input
                        type="radio"
                        name="targetClass"
                        className="sr-only"
                        checked={selectedTargetClass?.classId === option.classId}
                        onChange={() => {
                          setSelectedTargetClass(option)
                          setWeekOffset(0)
                          setSelectedSessionIndex(null)
                        }}
                      />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {option.classCode}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {option.subjectName}
                            </Badge>
                            {isScheduled && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                Sắp khai giảng
                              </Badge>
                            )}
                          </div>
                          <span className={cn(
                            'text-xs font-medium shrink-0 tabular-nums',
                            option.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-600'
                          )}>
                            {getCapacityText(option.availableSlots, option.maxCapacity)}
                          </span>
                        </div>
                        
                        {/* Branch + Modality with change indicators */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {hasBranchChange && <span className="text-blue-600 font-medium">→</span>}
                          <span className={cn(hasBranchChange && "text-blue-600 font-medium")}>
                            {option.branchName}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          {hasModalityChange && <span className="text-blue-600 font-medium">→</span>}
                          <span className={cn(hasModalityChange && "text-blue-600 font-medium")}>
                            {getModalityLabel(option.modality)}
                          </span>
                        </div>
                        
                        {/* Schedule Info */}
                        {scheduleInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{scheduleInfo}</span>
                            {isScheduled && startDate && (
                              <>
                                <span>·</span>
                                <span>Bắt đầu {startDate}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Content Gap Warning */}
                        {gapText && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{gapText}</span>
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 4: Session selection & confirmation */}
      {currentStep === 4 && selectedTargetClass && selectedCurrentClass && (
        <Section>
          <div className="space-y-4">
            {/* Horizontal Timeline - only show if both classes have allSessions */}
            {selectedCurrentClass.allSessions && selectedTargetClass.allSessions ? (
              <HorizontalTimeline
                currentClassSessions={selectedCurrentClass.allSessions}
                targetClassSessions={selectedTargetClass.allSessions}
                currentClassCode={selectedCurrentClass.classCode}
                targetClassCode={selectedTargetClass.classCode}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
                lastAttendedSessionId={selectedCurrentClass.lastAttendedSessionId}
                upcomingSessionId={selectedCurrentClass.upcomingSessionId}
                currentSubjectId={selectedCurrentClass.subjectId}
                targetSubjectId={selectedTargetClass.subjectId}
              />
            ) : (
              /* Fallback: Old week-based session selection UI */
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
                                Buổi {session.subjectSessionNumber} · {format(sessionDate, 'dd/MM/yyyy (EEEE)', { locale: vi })}
                              </p>
                              <p className="text-sm text-muted-foreground">{session.subjectSessionTitle}</p>
                              <p className="text-xs text-muted-foreground">{session.timeSlot}</p>
                            </div>
                          </SelectionCard>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
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
  )
}