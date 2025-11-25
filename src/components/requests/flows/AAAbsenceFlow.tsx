import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useSearchStudentsQuery,
  useGetStudentClassesQuery,
  useGetAcademicWeeklyScheduleQuery,
  useSubmitAbsenceOnBehalfMutation,
  type StudentSearchResult
} from '@/store/services/studentRequestApi'
import { type SessionSummaryDTO } from '@/store/services/studentScheduleApi'
import {
  Section,
  ReasonInput,
  NoteInput,
  BaseFlowComponent,
  SelectionCard
} from '../UnifiedRequestFlow'
import {
  useDebouncedValue,
  useSuccessHandler,
  useErrorHandler,
  Validation,
  WEEK_DAYS,
  WEEK_DAY_LABELS
} from '../utils'


interface AASessionOption extends SessionSummaryDTO {
  isSelectable: boolean
  disabledReason: string | null
}

interface AAAbsenceFlowProps {
  onSuccess: () => void
}

function parseAAAbsenceDateTime(dateStr: string, timeStr?: string) {
  if (!timeStr) {
    return parseISO(dateStr)
  }
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr.length === 8 ? timeStr : `${timeStr}:00`
  return parseISO(`${dateStr}T${normalizedTime}`)
}

function getAAAbsenceAvailability(session: SessionSummaryDTO) {
  const sessionDateTime = parseAAAbsenceDateTime(session.date, session.startTime)
  const now = new Date()
  const isPast = sessionDateTime.getTime() <= now.getTime()
  const hasAttendanceRecord = session.attendanceStatus && session.attendanceStatus !== 'PLANNED'
  const isInactiveStatus = session.sessionStatus && session.sessionStatus !== 'PLANNED'

  let disabledReason: string | null = null
  if (isPast) {
    disabledReason = 'Buổi đã diễn ra'
  } else if (hasAttendanceRecord) {
    disabledReason = 'Đã điểm danh'
  } else if (isInactiveStatus) {
    disabledReason = 'Buổi không khả dụng'
  }

  return {
    isSelectable: !isPast && !hasAttendanceRecord && !isInactiveStatus,
    disabledReason,
  }
}

export default function AAAbsenceFlow({ onSuccess }: AAAbsenceFlowProps) {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [weekCursor, setWeekCursor] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

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

  const { data: classesResponse, isFetching: isLoadingClasses } = useGetStudentClassesQuery(
    selectedStudent ? { studentId: selectedStudent.id } : skipToken,
    { skip: !selectedStudent }
  )
  const classOptions = classesResponse?.data ?? []
  const selectedClass = classOptions.find((cls) => cls.classId === selectedClassId) ?? null

  const { data: scheduleResponse, isFetching: isLoadingSchedule } = useGetAcademicWeeklyScheduleQuery(
    selectedStudent && selectedClass
      ? {
        studentId: selectedStudent.id,
        classId: selectedClass.classId,
        weekStart: weekCursor ?? undefined,
      }
      : skipToken,
    { skip: !selectedStudent || !selectedClass }
  )

  const weekData = scheduleResponse?.data
  const groupedSessions = useMemo(() => {
    if (!weekData) return []
    const startDate = parseISO(weekData.weekStart)
    return WEEK_DAYS.map((day, index) => {
      const dayDate = new Date(startDate)
      dayDate.setDate(dayDate.getDate() + index)
      const sessions: AASessionOption[] = (weekData.schedule?.[day] ?? []).map((session: SessionSummaryDTO) => {
        const { isSelectable, disabledReason } = getAAAbsenceAvailability(session)
        return {
          ...session,
          isSelectable,
          disabledReason,
        }
      })
      return {
        day,
        date: dayDate,
        sessions,
      }
    })
  }, [weekData])
  const displayedGroups = groupedSessions.filter((group) => group.sessions.length > 0)
  const allSessions = groupedSessions.flatMap((group) => group.sessions)
  const selectedSession = allSessions.find((session) => session.sessionId === selectedSessionId) ?? null

  const [submitAbsence, { isLoading: isSubmitting }] = useSubmitAbsenceOnBehalfMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const baseWeekStart = weekCursor ?? weekData?.weekStart ?? null
  const weekRangeLabel = weekData
    ? `${format(parseISO(weekData.weekStart), 'dd/MM', { locale: vi })} - ${format(parseISO(weekData.weekEnd), 'dd/MM', { locale: vi })}`
    : 'Chọn buổi để hiển thị'

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setStudentSearch(student.fullName)
    setSelectedClassId(null)
    setSelectedSessionId(null)
    setWeekCursor(null)
    setReason('')
    setNote('')
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (!baseWeekStart) return
    const nextStart = new Date(parseISO(baseWeekStart))
    nextStart.setDate(nextStart.getDate() + (direction === 'next' ? 7 : -7))
    setWeekCursor(format(nextStart, 'yyyy-MM-dd'))
    setSelectedSessionId(null)
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedStudent) setCurrentStep(2)
    else if (currentStep === 2 && selectedClass) setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedStudent || !selectedClass || !selectedSession) {
      handleError(new Error('Vui lòng chọn học viên, lớp và buổi học'))
      return
    }

    try {
      await submitAbsence({
        requestType: 'ABSENCE',
        studentId: selectedStudent.id,
        currentClassId: selectedClass.classId,
        targetSessionId: selectedSession.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  // Step states
  const step1Complete = !!selectedStudent
  const step2Complete = !!(selectedStudent && selectedClass)
  const step3Complete = !!(selectedStudent && selectedClass && selectedSession && reason.trim().length >= 10)

  const steps = [
    {
      id: 1,
      title: 'Chọn học viên',
      description: 'Tìm kiếm học viên để tạo yêu cầu thay',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn lớp học',
      description: 'Chọn lớp để xem lịch học',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Chọn buổi và lý do',
      description: 'Chọn buổi chưa diễn ra và điền lý do',
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
        (currentStep === 2 && !selectedClass)
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
            {studentSearch.trim().length > 0 && studentOptions.length > 0 && (
              <div className="space-y-2">
                {isSearchingStudents ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  studentOptions.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30",
                        selectedStudent?.id === student.id && "border-primary bg-primary/5"
                      )}
                    >
                      <p className="font-medium">
                        {student.fullName} <span className="text-muted-foreground">({student.studentCode})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.email} · {student.phone}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedStudent && (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Học viên đã chọn</p>
                    <p className="font-semibold">{selectedStudent.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.studentCode} · {selectedStudent.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Chi nhánh: {selectedStudent.branchName} · Đang học: {selectedStudent.activeEnrollments} lớp
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 2: Class selection */}
      {currentStep === 2 && selectedStudent && (
        <Section>
          <div className="space-y-3">
            {isLoadingClasses ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : classOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Học viên chưa đăng ký lớp nào
              </div>
            ) : (
              <div className="space-y-2">
                {classOptions.map((cls) => (
                  <SelectionCard
                    key={cls.classId}
                    item={cls}
                    isSelected={selectedClassId === cls.classId}
                    onSelect={() => {
                      setSelectedClassId(cls.classId)
                      setSelectedSessionId(null)
                      setWeekCursor(null)
                    }}
                  >
                    <p className="font-medium">
                      {cls.classCode} · {cls.className}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cls.branchName} · {cls.scheduleSummary}
                    </p>
                  </SelectionCard>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 3: Weekly schedule + reason */}
      {currentStep === 3 && selectedClass && (
        <Section>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Tuần đang xem</p>
                <p className="font-medium">{weekRangeLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleWeekChange('prev')}
                  disabled={!baseWeekStart}
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWeekCursor(null)
                    setSelectedSessionId(null)
                  }}
                  disabled={!weekData}
                >
                  Tuần hiện tại
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleWeekChange('next')}
                  disabled={!baseWeekStart}
                >
                  →
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingSchedule ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : displayedGroups.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Tuần này chưa có buổi học nào trong lịch
                </div>
              ) : (
                displayedGroups.map((group) => (
                  <div key={group.day} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {WEEK_DAY_LABELS[group.day]} · {format(group.date, 'dd/MM', { locale: vi })}
                    </p>
                    <div className="space-y-2">
                      {group.sessions.map((session) => {
                        const isActive = selectedSessionId === session.sessionId
                        return (
                          <SelectionCard
                            key={session.sessionId}
                            item={session}
                            isSelected={isActive}
                            onSelect={() => {
                              if (session.isSelectable) {
                                setSelectedSessionId(session.sessionId)
                              }
                            }}
                            disabled={!session.isSelectable}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1">
                                <p className="font-medium">
                                  {session.classCode} · {session.startTime} - {session.endTime}
                                </p>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.branchName} · {session.modality === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm'}
                                </p>
                                {!session.isSelectable && session.disabledReason && (
                                  <p className="text-xs font-medium text-rose-600">{session.disabledReason}</p>
                                )}
                              </div>
                            </div>
                          </SelectionCard>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedSession && (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                    <p className="font-semibold">
                      {selectedSession.classCode} · {selectedSession.startTime} - {selectedSession.endTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedSession.topic}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)}>
                    Đổi buổi
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <ReasonInput
                    value={reason}
                    onChange={(val) => {
                      setReason(val)
                      if (reasonError) setReasonError(null)
                    }}
                    placeholder="Chia sẻ lý do cụ thể để lưu vào hồ sơ..."
                    error={reasonError}
                  />

                  <NoteInput
                    value={note}
                    onChange={setNote}
                    placeholder="Ghi chú thêm cho phụ huynh..."
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