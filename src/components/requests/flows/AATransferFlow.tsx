import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
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
import type { SessionModality } from '@/store/services/studentRequestApi'


interface AATransferFlowProps {
  onSuccess: () => void
}

export default function AATransferFlow({ onSuccess }: AATransferFlowProps) {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedCurrentClass, setSelectedCurrentClass] = useState<TransferEligibility | null>(null)
  const [selectedTargetClass, setSelectedTargetClass] = useState<TransferOption | null>(null)
  const [targetBranchId, setTargetBranchId] = useState<number | undefined>()
  const [targetModality, setTargetModality] = useState<SessionModality | undefined>()
  const [effectiveDate, setEffectiveDate] = useState('')
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
    setEffectiveDate('')
    setRequestReason('')
    setNote('')
  }

  const handleSelectCurrentClass = (classData: TransferEligibility) => {
    setSelectedCurrentClass(classData)
    setSelectedTargetClass(null)
  }

  const handleSelectTargetClass = (classData: TransferOption) => {
    setSelectedTargetClass(classData)
  }

  const handleReset = useCallback(() => {
    setSelectedCurrentClass(null)
    setSelectedTargetClass(null)
    setTargetBranchId(undefined)
    setTargetModality(undefined)
    setEffectiveDate('')
    setRequestReason('')
    setNote('')
  }, [])

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

    if (!effectiveDate) {
      handleError(new Error('Vui lòng chọn ngày hiệu lực'))
      return
    }

    try {
      await submitTransfer({
        studentId: selectedStudent.id,
        currentClassId: selectedCurrentClass.classId,
        targetClassId: selectedTargetClass.classId,
        effectiveDate,
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
      onSubmit={handleSubmit}
      submitButtonText="Tạo yêu cầu"
      isSubmitDisabled={!step3Complete}
      isSubmitting={isSubmitting}
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

      {/* Step 2: Current class selection */}
      <Section className={!step1Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[1]} stepNumber={2} />

        {step1Complete && (
          <div className="space-y-3">
            {isLoadingEligibility ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : eligibilityOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Học viên không có lớp nào đủ điều kiện chuyển
              </div>
            ) : (
              <div className="space-y-2">
                {eligibilityOptions.map((cls: TransferEligibility) => (
                  <button
                    key={cls.enrollmentId}
                    type="button"
                    onClick={() => handleSelectCurrentClass(cls)}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30',
                      selectedCurrentClass?.enrollmentId === cls.enrollmentId && 'border-primary bg-primary/5'
                    )}
                  >
                    <p className="font-medium">
                      {cls.classCode} · {cls.className}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cls.branchName} · {cls.modality && getModalityLabel(cls.modality)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Quota chuyển: {cls.transferQuota.used}/{cls.transferQuota.limit}
                      </p>
                      {cls.canTransfer ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600">Đủ điều kiện</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-600">Không đủ điều kiện</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Step 3: Target class selection */}
      <Section className={!step2Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[2]} stepNumber={3} />

        {step2Complete && (
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
            {isLoadingOptions ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : transferOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Không có lớp mục tiêu phù hợp với bộ lọc hiện tại
              </div>
            ) : selectedTargetClass ? (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Lớp mục tiêu đã chọn</p>
                    <p className="font-medium">
                      {selectedTargetClass.classCode} · {selectedTargetClass.className}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTargetClass.branchName} · {getModalityLabel(selectedTargetClass.modality)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getCapacityText(selectedTargetClass.availableSlots, selectedTargetClass.maxCapacity)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTargetClass(null)}>
                    Đổi lớp
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ngày hiệu lực</label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
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
            ) : (
              <div className="space-y-2">
                {transferOptions.map((option: TransferOption) => (
                  <button
                    key={option.classId}
                    type="button"
                    onClick={() => handleSelectTargetClass(option)}
                    className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {option.classCode} · {option.className}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {option.branchName} · {getModalityLabel(option.modality)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.scheduleInfo ?? option.scheduleDays + ' ' + option.scheduleTime} · {getCapacityText(option.availableSlots, option.maxCapacity)}
                        </p>
                      </div>
                      {option.canTransfer ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600">Có thể chuyển</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-600">Không thể chuyển</Badge>
                      )}
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