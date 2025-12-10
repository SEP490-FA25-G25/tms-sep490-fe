import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPinIcon, VideoIcon } from 'lucide-react'

import {
  useGetStudentClassesQuery,
  useGetAcademicWeeklyScheduleQuery,
  useSubmitAbsenceOnBehalfMutation,
  type StudentSearchResult
} from '@/store/services/studentRequestApi'
import { SelectStudentStep } from '@/app/academic/student-requests/components/steps/SelectStudentStep'
import { type SessionSummaryDTO } from '@/store/services/studentScheduleApi'
import {
  Section,
  ReasonInput,
  NoteInput,
  BaseFlowComponent,
  SelectionCard
} from '../UnifiedRequestFlow'
import {
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

  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [weekCursor, setWeekCursor] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const { data: classesResponse, isFetching: isLoadingClasses } = useGetStudentClassesQuery(
    selectedStudent ? { studentId: selectedStudent.id } : skipToken,
    { skip: !selectedStudent }
  )
  // Backend trả về Page<StudentClassDTO> với pagination, data nằm trong .content
  // Chỉ lấy các lớp đang học (ENROLLED + ONGOING) cho absence request
  const classOptions = (classesResponse?.data?.content ?? []).filter(
    (cls) => cls.enrollmentStatus === 'ENROLLED' && cls.status === 'ONGOING'
  )
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
    setSelectedClassId(null)
    setSelectedSessionId(null)
    setWeekCursor(null)
    setReason('')
    setNote('')
    setCurrentStep(2) // Auto advance to next step
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (!baseWeekStart) return
    const nextStart = new Date(parseISO(baseWeekStart))
    nextStart.setDate(nextStart.getDate() + (direction === 'next' ? 7 : -7))
    setWeekCursor(format(nextStart, 'yyyy-MM-dd'))
    setSelectedSessionId(null)
  }

  const handleNext = () => {
    if (currentStep === 2 && selectedClass) setCurrentStep(3)
    if (currentStep === 3 && selectedSession) setCurrentStep(4)
  }

  const handleBack = () => {
    if (currentStep === 4) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(2)
      setSelectedSessionId(null)
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setSelectedStudent(null)
    }
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
  const step3Complete = !!(selectedStudent && selectedClass && selectedSession)
  const step4Complete = !!(step3Complete && reason.trim().length >= 10)

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
      title: 'Chọn lớp học',
      description: 'Chọn lớp để xem lịch học',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Chọn buổi học',
      description: 'Chọn buổi chưa diễn ra',
      isComplete: step3Complete,
      isAvailable: step2Complete
    },
    {
      id: 4,
      title: 'Lý do nghỉ học',
      description: 'Điền lý do và ghi chú',
      isComplete: step4Complete,
      isAvailable: step3Complete
    }
  ]

  // Step 1 uses SelectStudentStep component outside BaseFlowComponent
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
      isNextDisabled={(currentStep === 2 && !selectedClass) || (currentStep === 3 && !selectedSession)}
      isSubmitDisabled={!step4Complete}
      isSubmitting={isSubmitting}
      submitLabel="Xử lý yêu cầu"
    >

      {/* Step 2: Class selection */}
      {currentStep === 2 && selectedStudent && (
        <Section>
          <div className="min-h-[280px] space-y-3">
            {!isLoadingClasses && classOptions.length === 0 ? (
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

      {/* Step 3: Session selection only */}
      {currentStep === 3 && selectedClass && (
        <Section>
          <div className="min-h-[280px] space-y-4">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <span className="font-medium text-sm">{weekRangeLabel}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleWeekChange('prev')} disabled={!baseWeekStart}>←</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setWeekCursor(null); setSelectedSessionId(null) }} disabled={!weekData}>Hôm nay</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleWeekChange('next')} disabled={!baseWeekStart}>→</Button>
              </div>
            </div>

            <div className="space-y-4">
              {!isLoadingSchedule && displayedGroups.length === 0 ? (
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">
                                    {session.classCode} · {session.startTime} - {session.endTime}
                                  </p>
                                  <Badge variant={session.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                                    {session.modality === 'ONLINE' ? (
                                      <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                                    ) : (
                                      <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                                    )}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>{session.branchName}</span>
                                  {session.resourceName && (
                                    <>
                                      <span>·</span>
                                      <span>{session.resourceName}</span>
                                    </>
                                  )}
                                </div>
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
          </div>
        </Section>
      )}

      {/* Step 4: Session info display + Reason/Note input */}
      {currentStep === 4 && selectedSession && (
        <Section>
          <div className="min-h-[280px] space-y-4">
            {/* Selected Session Summary */}
            <div className="rounded-lg bg-muted/30 p-3 border">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{selectedSession.classCode}</span>
                    <span className="text-xs text-muted-foreground">{selectedSession.startTime}-{selectedSession.endTime}</span>
                    <Badge variant={selectedSession.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                      {selectedSession.modality === 'ONLINE' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(selectedSession.date), 'EEE dd/MM', { locale: vi })} · {selectedSession.topic}
                  </p>
                  {selectedSession.resourceName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSession.modality === 'ONLINE' ? '🔗' : '📍'} {selectedSession.resourceName}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => setCurrentStep(3)}>Đổi buổi</Button>
              </div>
            </div>

            {/* Reason and Note inputs */}
            <div className="space-y-3">
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
        </Section>
      )}
    </BaseFlowComponent>
  )
}