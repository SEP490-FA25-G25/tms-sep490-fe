import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useSearchStudentsQuery,
  useGetStudentMissedSessionsQuery,
  useGetStudentMakeupOptionsQuery,
  useCreateOnBehalfRequestMutation,
  type StudentSearchResult
} from '@/store/services/studentRequestApi'
import {
  StepHeader,
  Section,
  ReasonInput,
  NoteInput,
  BaseFlowComponent
} from '../UnifiedRequestFlow'
import {
  useDebouncedValue,
  getModalityLabel,
  getCapacityText,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../utils'

const MAKEUP_LOOKBACK_WEEKS = 2

interface AAMakeupFlowProps {
  onSuccess: () => void
}

export default function AAMakeupFlow({ onSuccess }: AAMakeupFlowProps) {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [excludeRequested, setExcludeRequested] = useState(true)
  const [reason, setReason] = useState('')
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
    data: missedResponse,
    isFetching: isLoadingMissed,
  } = useGetStudentMissedSessionsQuery(
    selectedStudent
      ? { studentId: selectedStudent.id, weeksBack: MAKEUP_LOOKBACK_WEEKS, excludeRequested }
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
    isFetching: isLoadingStudentOptions,
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

  
  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setStudentSearch(student.fullName)
    handleReset()
  }

  const handleReset = useCallback(() => {
    setSelectedMissedId(null)
    setSelectedMakeupId(null)
    setReason('')
    setNote('')
  }, [])

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
        note: note.trim() || undefined,
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  // Step states
  const step1Complete = !!selectedStudent
  const step2Complete = !!(selectedStudent && selectedMissedSession)
  const step3Complete = !!(selectedStudent && selectedMissedSession && selectedMakeupOption && reason.trim().length >= 10)

  const steps = [
    {
      id: 1,
      title: 'Chọn học viên',
      description: 'Tìm kiếm học viên để tạo yêu cầu học bù',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn buổi đã vắng',
      description: `Buổi vắng trong ${MAKEUP_LOOKBACK_WEEKS} tuần gần nhất`,
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Chọn buổi học bù',
      description: 'Gợi ý buổi học phù hợp',
      isComplete: step3Complete,
      isAvailable: step2Complete
    }
  ]

  return (
    <BaseFlowComponent
      onSubmit={handleSubmit}
      submitButtonText="Tạo yêu cầu"
      isSubmitDisabled={!step3Complete}
      isSubmitting={isCreating}
      onReset={handleReset}
    >
      {/* Step 1: Student selection */}
      <Section>
        <StepHeader step={steps[0]} stepNumber={1} />

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
                    className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(null)
                    setStudentSearch('')
                    handleReset()
                  }}
                >
                  Đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Step 2: Missed session selection */}
      <Section className={!step1Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[1]} stepNumber={2} />

        {step1Complete && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {missedSessions.length} buổi vắng tìm thấy
              </p>
              <Button
                variant={excludeRequested ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExcludeRequested((prev) => !prev)}
              >
                {excludeRequested ? 'Ẩn đã gửi' : 'Hiện tất cả'}
              </Button>
            </div>

            {isLoadingMissed ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : missedSessions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Không có buổi vắng hợp lệ trong {MAKEUP_LOOKBACK_WEEKS} tuần gần nhất
              </div>
            ) : selectedMissedSession ? (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                    <p className="font-medium">
                      {format(parseISO(selectedMissedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} ·{' '}
                      {selectedMissedSession.classInfo.classCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Buổi {selectedMissedSession.courseSessionNumber}: {selectedMissedSession.courseSessionTitle}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMissedId(null)}>
                    Đổi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {missedSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => setSelectedMissedId(session.sessionId)}
                    className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(parseISO(session.date), 'EEEE, dd/MM', { locale: vi })} · {session.classInfo.classCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                        </p>
                      </div>
                      <Badge className={cn(session.isExcusedAbsence ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
                        {session.isExcusedAbsence ? 'Có phép' : 'Không phép'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Step 3: Makeup session selection */}
      <Section className={!step2Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[2]} stepNumber={3} />

        {step2Complete && (
          <div className="space-y-3">
            {!selectedMissedSession ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Chọn buổi đã vắng trước để xem gợi ý học bù
              </div>
            ) : isLoadingStudentOptions ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : makeupOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Không có buổi học bù khả dụng
              </div>
            ) : selectedMakeupOption ? (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Buổi học bù đã chọn</p>
                    <p className="font-medium">
                      {format(parseISO(selectedMakeupOption.date), 'EEEE, dd/MM/yyyy', { locale: vi })} ·{' '}
                      {selectedMakeupOption.classInfo.classCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMakeupOption.timeSlotInfo.startTime} - {selectedMakeupOption.timeSlotInfo.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.classInfo.branchName} · {getModalityLabel(selectedMakeupOption.classInfo.modality)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getCapacityText(selectedMakeupOption.availableSlots, selectedMakeupOption.maxCapacity)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMakeupId(null)}>
                    Đổi
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <ReasonInput
                    value={reason}
                    onChange={setReason}
                    placeholder="Chia sẻ lý do cụ thể..."
                    error={null}
                  />

                  <NoteInput
                    value={note}
                    onChange={setNote}
                    placeholder="Ghi chú thêm về yêu cầu học bù..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {makeupOptions.map((option) => (
                  <button
                    key={option.sessionId}
                    type="button"
                    onClick={() => setSelectedMakeupId(option.sessionId)}
                    className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(parseISO(option.date), 'EEEE, dd/MM', { locale: vi })} · {option.classInfo.classCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {option.timeSlotInfo.startTime} - {option.timeSlotInfo.endTime} · {getModalityLabel(option.classInfo.modality)}
                        </p>
                        <p className="text-xs text-primary">{getCapacityText(option.availableSlots, option.maxCapacity)}</p>
                      </div>
                      {option.matchScore.priority === 'HIGH' && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Ưu tiên cao</Badge>}
                      {option.matchScore.priority === 'MEDIUM' && <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Ưu tiên TB</Badge>}
                      {option.matchScore.priority === 'LOW' && <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20">Ưu tiên thấp</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>
    </BaseFlowComponent>
  )
}