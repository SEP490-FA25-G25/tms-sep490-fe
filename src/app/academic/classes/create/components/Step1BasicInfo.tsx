import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useGetCoursesQuery,
  usePreviewClassCodeMutation,
} from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { useGetMyBranchesQuery } from '@/store/services/branchApi'

// Validation schema - removed HYBRID
const createClassSchema = z.object({
  branchId: z.number().positive('Vui lòng chọn chi nhánh'),
  courseId: z.number().positive('Vui lòng chọn khóa học'),
  code: z.string().optional(),
  name: z.string().min(1, 'Tên lớp không được để trống').max(255, 'Tên lớp tối đa 255 ký tự'),
  modality: z.enum(['ONLINE', 'OFFLINE']),
  startDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Ngày bắt đầu phải là ngày trong tương lai',
  }),
  plannedEndDate: z.string().optional(),
  scheduleDays: z
    .array(z.number().min(0).max(6))
    .min(1, 'Phải chọn ít nhất 1 ngày')
    .max(7, 'Tối đa 7 ngày'),
  maxCapacity: z.number().min(1, 'Sức chứa phải ít nhất 1').max(99, 'Sức chứa tối đa 99'),
})

type FormData = z.infer<typeof createClassSchema>

// Reordered: Mon-Sun
const DAY_OPTIONS = [
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' },
  { value: 0, label: 'Chủ nhật' },
]

interface Step1BasicInfoProps {
  classId?: number | null
  onSuccess: (classId: number) => void
}

export function Step1BasicInfo({ classId, onSuccess }: Step1BasicInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      code: '',
      scheduleDays: [],
      modality: 'OFFLINE',
      plannedEndDate: undefined,
    },
  })

  // Real-time validation error states
  const [branchError, setBranchError] = useState<string | null>(null)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [scheduleDaysError, setScheduleDaysError] = useState<string | null>(null)

  const [createClass] = useCreateClassMutation()
  const [updateClass] = useUpdateClassMutation()

  // Fetch existing class data if editing
  const { data: existingClassData } = useGetClassByIdQuery(classId!, {
    skip: !classId,
  })
  const classStatus = existingClassData?.data?.status
  const approvalStatus = existingClassData?.data?.approvalStatus
  const isEditLocked = Boolean(classId && (
    (classStatus === 'DRAFT' && approvalStatus === 'PENDING') ||
    approvalStatus === 'APPROVED'
  ))
  const editLockMessage = (() => {
    if (classStatus === 'DRAFT' && approvalStatus === 'PENDING') {
      return 'Lớp đang chờ duyệt, không thể chỉnh sửa.'
    }
    if (approvalStatus === 'APPROVED') {
      return 'Lớp đã được duyệt, không thể chỉnh sửa.'
    }
    return 'Lớp không được chỉnh sửa trong trạng thái này.'
  })()

  // Use getMyBranches for current user's assigned branches
  const { data: branchesData, isLoading: isBranchesLoading } = useGetMyBranchesQuery()
  const { data: coursesData, isLoading: isCoursesLoading } = useGetCoursesQuery()
  const [previewClassCode] = usePreviewClassCodeMutation()

  const branches = useMemo(() => branchesData?.data || [], [branchesData])
  const courses = useMemo(() => coursesData?.data || [], [coursesData])

  const selectedBranchId = watch('branchId')
  const selectedCourseId = watch('courseId')
  const selectedDays = watch('scheduleDays') || []
  const selectedDate = watch('startDate')
  const modality = watch('modality')

  // Track if form has been populated from existing class data
  const [isFormPopulated, setIsFormPopulated] = React.useState(false)

  // Populate form when data loads - wait for branches and courses to be available
  useEffect(() => {
    if (existingClassData?.data && branches.length > 0 && courses.length > 0 && !isFormPopulated) {
      const data = existingClassData.data
      
      // Verify branch exists in available branches
      const branchExists = branches.some(b => b.id === data.branch.id)
      if (branchExists) {
        setValue('branchId', data.branch.id)
      }
      
      // Verify course exists in available courses
      const courseExists = courses.some(c => c.id === data.course.id)
      if (courseExists) {
        setValue('courseId', data.course.id)
      }
      
      setValue('code', data.code)
      setValue('name', data.name)
      // Handle legacy HYBRID data - default to OFFLINE
      setValue('modality', data.modality === 'HYBRID' ? 'OFFLINE' : data.modality)
      setValue('startDate', data.startDate)
      setValue('plannedEndDate', data.plannedEndDate)
      setValue('scheduleDays', data.scheduleDays)
      setValue('maxCapacity', data.maxCapacity)
      
      setIsFormPopulated(true)
    }
  }, [existingClassData, setValue, branches, courses, isFormPopulated])

  // Auto-generate class code when all required fields are filled
  const handlePreviewFetch = useCallback(async () => {
    if (!selectedBranchId || !selectedCourseId || !selectedDate) {
      return
    }
    try {
      const response = await previewClassCode({
        branchId: selectedBranchId,
        courseId: selectedCourseId,
        startDate: selectedDate,
      }).unwrap()

      if (response?.data?.previewCode) {
        setValue('code', response.data.previewCode, { shouldValidate: true })
      }
    } catch {
      toast.error('Không thể sinh mã lớp tự động. Vui lòng thử lại.')
    }
  }, [previewClassCode, selectedBranchId, selectedCourseId, selectedDate, setValue])

  // Auto-fetch preview when all conditions met
  useEffect(() => {
    const canPreviewCode = Boolean(selectedBranchId && selectedCourseId && selectedDate)
    if (canPreviewCode) {
      void handlePreviewFetch()
    }
  }, [selectedBranchId, selectedCourseId, selectedDate, handlePreviewFetch])

  // Real-time validation functions
  const validateBranch = (value: number | undefined): string | null => {
    if (!value || value <= 0) return 'Vui lòng chọn chi nhánh'
    return null
  }

  const validateCourse = (value: number | undefined): string | null => {
    if (!value || value <= 0) return 'Vui lòng chọn khóa học'
    return null
  }

  const validateStartDate = (value: string | undefined): string | null => {
    if (!value) return 'Vui lòng chọn ngày bắt đầu'
    if (new Date(value) <= new Date()) return 'Ngày bắt đầu phải là ngày trong tương lai'
    return null
  }

  const validateCapacity = (value: number | undefined): string | null => {
    if (!value || value < 1) return 'Sức chứa phải ít nhất 1'
    if (value > 99) return 'Sức chứa tối đa 99'
    return null
  }

  const validateName = (value: string): string | null => {
    if (!value.trim()) return 'Tên lớp không được để trống'
    if (value.length > 255) return 'Tên lớp tối đa 255 ký tự'
    return null
  }

  const validateScheduleDays = (value: number[]): string | null => {
    if (!value || value.length === 0) return 'Phải chọn ít nhất 1 ngày'
    if (value.length > 7) return 'Tối đa 7 ngày'
    return null
  }

  // Handle field changes with real-time validation
  const handleBranchChange = (val: string) => {
    const value = parseInt(val)
    setValue('branchId', value, { shouldValidate: true })
    setBranchError(validateBranch(value))
  }

  const handleCourseChange = (val: string) => {
    const value = parseInt(val)
    setValue('courseId', value, { shouldValidate: true })
    setCourseError(validateCourse(value))
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // Use format to preserve local date (avoid toISOString which converts to UTC)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      setValue('startDate', dateStr, { shouldValidate: true })
      setStartDateError(validateStartDate(dateStr))
    }
  }

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setValue('maxCapacity', value, { shouldValidate: true })
    setCapacityError(validateCapacity(value))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('name', value, { shouldValidate: true })
    setNameError(validateName(value))
  }

  const toggleDay = (dayValue: number) => {
    const currentDays = selectedDays || []
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter((d: number) => d !== dayValue)
      : [...currentDays, dayValue].sort()

    setValue('scheduleDays', newDays, { shouldValidate: true })
    setScheduleDaysError(validateScheduleDays(newDays))
  }

  const onSubmit = async (data: FormData) => {
    // Final validation before submit
    const branchErr = validateBranch(data.branchId)
    const courseErr = validateCourse(data.courseId)
    const dateErr = validateStartDate(data.startDate)
    const capErr = validateCapacity(data.maxCapacity)
    const nameErr = validateName(data.name)
    const daysErr = validateScheduleDays(data.scheduleDays)

    if (branchErr || courseErr || dateErr || capErr || nameErr || daysErr) {
      setBranchError(branchErr)
      setCourseError(courseErr)
      setStartDateError(dateErr)
      setCapacityError(capErr)
      setNameError(nameErr)
      setScheduleDaysError(daysErr)
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ')
      return
    }

    try {
      let resultClassId: number

      if (classId) {
        await updateClass({ classId, data }).unwrap()
        resultClassId = classId
        toast.success('Cập nhật lớp thành công!')
      } else {
        const response = await createClass(data).unwrap()
        resultClassId = response.data.classId
        toast.success('Tạo lớp thành công!')
      }

      onSuccess(resultClassId)
    } catch (err: unknown) {
      const error = err as {
        status?: number
        data?: { message?: string; data?: unknown; errorCode?: string }
      }
      const message = error.data?.message
      const errorCode = error.data?.errorCode

      if (error.status === 400) {
        if (error.data?.data && typeof error.data.data === 'object') {
          toast.error(message || 'Dữ liệu không hợp lệ')
        } else {
          toast.error(message || 'Có lỗi xảy ra')
        }
      } else if (message === 'CLASS_NOT_EDITABLE' || errorCode === 'CLASS_NOT_EDITABLE') {
        toast.error('Lớp này đang chờ duyệt hoặc đã duyệt, không thể chỉnh sửa')
      } else if (error.status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này')
      } else {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Thông tin cơ bản</h2>
        <p className="text-muted-foreground">
          Nhập thông tin cơ bản về lớp học. Tất cả các trường đều bắt buộc.
        </p>
{isEditLocked && (
          <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{editLockMessage}</span>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Row 1: Chi nhánh + Khóa học */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/* Chi nhánh */}
        <div className="space-y-2">
          <Label htmlFor="branchId">
            Chi nhánh <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedBranchId ? selectedBranchId.toString() : undefined}
            onValueChange={handleBranchChange}
            disabled={isEditLocked || isBranchesLoading}
          >
            <SelectTrigger id="branchId" className={cn(branchError && 'border-destructive')}>
              <SelectValue placeholder="Chọn chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              {branches.length === 0 ? (
                <SelectItem value="no-branch" disabled>
                  Bạn chưa được phân công chi nhánh nào
                </SelectItem>
              ) : (
                branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {(branchError || errors.branchId) && (
            <p className="text-sm text-destructive">{branchError || errors.branchId?.message}</p>
          )}
        </div>

        {/* Khóa học */}
        <div className="space-y-2">
          <Label htmlFor="courseId">
            Khóa học <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCourseId ? selectedCourseId.toString() : undefined}
            onValueChange={handleCourseChange}
            disabled={isEditLocked || isCoursesLoading}
          >
            <SelectTrigger id="courseId" className={cn(courseError && 'border-destructive')}>
              <SelectValue placeholder="Chọn khóa học" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(courseError || errors.courseId) && (
            <p className="text-sm text-destructive">{courseError || errors.courseId?.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Ngày bắt đầu + Sức chứa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ngày bắt đầu - moved up before Mã lớp */}
        <div className="space-y-2">
          <Label>
            Ngày bắt đầu <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isEditLocked}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                  (startDateError || errors.startDate) && 'border-destructive'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate), 'PPP', { locale: vi }) : 'Chọn ngày'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={handleStartDateChange}
                disabled={(date: Date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {(startDateError || errors.startDate) && (
            <p className="text-sm text-destructive">{startDateError || errors.startDate?.message}</p>
          )}
        </div>

        {/* Sức chứa */}
        <div className="space-y-2">
          <Label htmlFor="maxCapacity">
            Sức chứa tối đa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="maxCapacity"
            type="number"
            min="1"
            max="1000"
            placeholder="Ví dụ: 30"
            disabled={isEditLocked}
            {...register('maxCapacity', { valueAsNumber: true })}
            onChange={handleCapacityChange}
            className={cn((capacityError || errors.maxCapacity) && 'border-destructive')}
          />
          {(capacityError || errors.maxCapacity) && (
            <p className="text-sm text-destructive">{capacityError || errors.maxCapacity?.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Mã lớp + Tên lớp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mã lớp - auto-generated only, no manual toggle */}
        <div className="space-y-2">
          <Label htmlFor="code">
            Mã lớp <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            placeholder="Tự động sinh khi chọn đủ thông tin"
            {...register('code')}
            readOnly
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Hệ thống tự sinh từ mã khóa + chi nhánh + năm bắt đầu.
          </p>
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>

        {/* Tên lớp */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Tên lớp <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ví dụ: Lớp IELTS Cơ Bản A"
            disabled={isEditLocked}
            {...register('name')}
            onChange={handleNameChange}
            className={cn((nameError || errors.name) && 'border-destructive')}
          />
          {(nameError || errors.name) && (
            <p className="text-sm text-destructive">{nameError || errors.name?.message}</p>
          )}
        </div>
      </div>

      {/* Hình thức học - removed HYBRID */}
      <div className="space-y-2">
        <Label>
          Hình thức học <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={modality}
          onValueChange={(val: string) => setValue('modality', val as 'ONLINE' | 'OFFLINE', { shouldValidate: true })}
          disabled={isEditLocked}
        >
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OFFLINE" id="offline" />
              <Label htmlFor="offline" className="font-normal cursor-pointer">
                Offline (Tại trung tâm)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ONLINE" id="online" />
              <Label htmlFor="online" className="font-normal cursor-pointer">
                Online (Trực tuyến)
              </Label>
            </div>
          </div>
        </RadioGroup>
        {errors.modality && <p className="text-sm text-destructive">{errors.modality.message}</p>}
      </div>

      {/* Ngày học trong tuần - reordered Mon-Sun */}
      <div className="space-y-2">
        <Label>
          Ngày học trong tuần <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAY_OPTIONS.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day.value}`}
                checked={selectedDays.includes(day.value)}
                onCheckedChange={() => toggleDay(day.value)}
                disabled={isEditLocked}
              />
              <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Chọn ít nhất 1 ngày, tối đa 7 ngày</p>
        {(scheduleDaysError || errors.scheduleDays) && (
          <p className="text-sm text-destructive">{scheduleDaysError || errors.scheduleDays?.message}</p>
        )}
      </div>

      {/* Submit button for form - hidden but needed for form submission */}
      <button type="submit" className="hidden" id="step1-submit-btn" />
    </form>
  )
}
