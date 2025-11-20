import React from 'react'
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
  useGetBranchesQuery,
  useGetCoursesQuery,
  usePreviewClassCodeMutation,
} from '@/store/services/classCreationApi'

const classCodePattern = /^[A-Z0-9]+-[A-Z0-9]+-\d{2}-\d{3}$/

// Validation schema
const createClassSchema = z.object({
  branchId: z.number().positive('Vui lòng chọn chi nhánh'),
  courseId: z.number().positive('Vui lòng chọn khóa học'),
  code: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length === 0 || classCodePattern.test(value),
      'Mã lớp phải theo định dạng COURSE-BRANCH-YY-XXX và chỉ chứa chữ hoa, số, dấu gạch ngang'
    ),
  name: z.string().min(1, 'Tên lớp không được để trống').max(255, 'Tên lớp tối đa 255 ký tự'),
  modality: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  startDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Ngày bắt đầu phải là ngày trong tương lai',
  }),
  scheduleDays: z
    .array(z.number().min(0).max(6))
    .min(1, 'Phải chọn ít nhất 1 ngày')
    .max(7, 'Tối đa 7 ngày'),
  maxCapacity: z.number().min(1, 'Sức chứa phải ít nhất 1').max(1000, 'Sức chứa tối đa 1000'),
})

type FormData = z.infer<typeof createClassSchema>

const DAY_OPTIONS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' },
]

interface Step1BasicInfoProps {
  onSuccess: (classId: number, sessionCount: number) => void
  onCancel: () => void
}

export function Step1BasicInfo({ onSuccess, onCancel }: Step1BasicInfoProps) {
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
    },
  })

  const [createClass, { isLoading }] = useCreateClassMutation()
  const { data: branchesData } = useGetBranchesQuery()
  const { data: coursesData } = useGetCoursesQuery()
  const [previewClassCode, { isLoading: isPreviewLoading }] = usePreviewClassCodeMutation()
  const [isManualCode, setIsManualCode] = React.useState(false)
  const [previewWarning, setPreviewWarning] = React.useState<string | null>(null)

  // Mock data for testing (remove when backend is ready)
  const branches = branchesData?.data || [
    { id: 1, name: 'TMS Ha Noi Branch', code: 'HN' },
    { id: 2, name: 'TMS Ho Chi Minh Branch', code: 'HCM' },
    { id: 3, name: 'TMS Da Nang Branch', code: 'DN' },
  ]

  const courses = coursesData?.data || [
    { id: 1, name: 'IELTS Foundation 2025', code: 'IELTS-FOUND' },
    { id: 2, name: 'TOEIC Basic 2025', code: 'TOEIC-BASIC' },
    { id: 3, name: 'Japanese N5 2025', code: 'JP-N5' },
  ]

  const selectedBranchId = watch('branchId')
  const selectedCourseId = watch('courseId')
  const selectedDays = watch('scheduleDays') || []
  const selectedDate = watch('startDate')
  const modality = watch('modality')

  const canPreviewCode =
    !isManualCode && Boolean(selectedBranchId && selectedCourseId && selectedDate)

  const handlePreviewFetch = React.useCallback(async () => {
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
      setPreviewWarning(response?.data?.warning || null)
    } catch {
      setPreviewWarning(null)
      toast.error('Không thể sinh mã lớp tự động. Vui lòng thử lại.')
    }
  }, [previewClassCode, selectedBranchId, selectedCourseId, selectedDate, setValue])

  React.useEffect(() => {
    if (!canPreviewCode) {
      if (!isManualCode) {
        setPreviewWarning(null)
      }
      return
    }
    void handlePreviewFetch()
  }, [canPreviewCode, handlePreviewFetch, isManualCode])

  const handleManualToggle = (checked: boolean | 'indeterminate') => {
    const nextValue = checked === true
    setIsManualCode(nextValue)
    if (!nextValue) {
      setPreviewWarning(null)
      if (selectedBranchId && selectedCourseId && selectedDate) {
        void handlePreviewFetch()
      } else {
        setValue('code', '', { shouldValidate: true })
      }
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const response = await createClass(data).unwrap()
      const createdClassId = response?.data?.classId
      const totalSessions = response?.data?.sessionSummary?.totalSessions ?? 0

      if (!createdClassId) {
        toast.error('Không nhận được thông tin lớp vừa tạo. Vui lòng thử lại.')
        return
      }

      const createdCode = response?.data?.code || data.code || 'mới'
      toast.success(`Lớp ${createdCode} đã được tạo với ${totalSessions} buổi học`)
      onSuccess(createdClassId, totalSessions)
    } catch (err: unknown) {
      const error = err as { status?: number; data?: { message?: string; data?: unknown } }
      if (error.status === 400) {
        if (error.data?.data && typeof error.data.data === 'object') {
          // Field-level errors
          toast.error(error.data.message || 'Dữ liệu không hợp lệ')
        } else {
          toast.error(error.data?.message || 'Có lỗi xảy ra khi tạo lớp học')
        }
      } else if (error.status === 403) {
        toast.error('Bạn không có quyền tạo lớp học')
      } else {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    }
  }

  const toggleDay = (dayValue: number) => {
    const currentDays = selectedDays || []
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter((d: number) => d !== dayValue)
      : [...currentDays, dayValue].sort()

    setValue('scheduleDays', newDays, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Thông tin cơ bản</h2>
        <p className="text-muted-foreground">
          Nhập thông tin cơ bản về lớp học. Tất cả các trường đều bắt buộc.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chi nhánh */}
        <div className="space-y-2">
          <Label htmlFor="branchId">
            Chi nhánh <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(val) => setValue('branchId', parseInt(val), { shouldValidate: true })}>
            <SelectTrigger id="branchId">
              <SelectValue placeholder="Chọn chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
        </div>

        {/* Khóa học */}
        <div className="space-y-2">
          <Label htmlFor="courseId">
            Khóa học <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(val) => setValue('courseId', parseInt(val), { shouldValidate: true })}>
            <SelectTrigger id="courseId">
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
          {errors.courseId && <p className="text-sm text-destructive">{errors.courseId.message}</p>}
        </div>

        {/* Mã lớp */}
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="code">
              Mã lớp <span className="text-destructive">*</span>
            </Label>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <Checkbox
                id="manual-code"
                checked={isManualCode}
                onCheckedChange={handleManualToggle}
              />
              Nhập mã thủ công
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="code"
              placeholder="Ví dụ: IELTSFOUND-HN01-25-001"
              {...register('code')}
              readOnly={!isManualCode}
              className={cn(!isManualCode && 'bg-muted/50', errors.code && 'border-destructive')}
            />
            {!isManualCode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handlePreviewFetch()}
                disabled={!canPreviewCode || isPreviewLoading}
              >
                {isPreviewLoading ? 'Đang sinh...' : 'Sinh mã mới'}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isManualCode
              ? 'Nhập theo định dạng COURSE-BRANCH-YY-XXX (ví dụ: IELTSFOUND-HN01-25-005).'
              : 'Hệ thống tự sinh từ mã khóa + chi nhánh + năm bắt đầu. Bạn có thể bật chế độ nhập thủ công nếu cần.'}
          </p>
          {previewWarning && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{previewWarning}</span>
              </AlertDescription>
            </Alert>
          )}
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
            {...register('name')}
            className={cn(errors.name && 'border-destructive')}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Ngày bắt đầu */}
        <div className="space-y-2">
          <Label>
            Ngày bắt đầu <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                  errors.startDate && 'border-destructive'
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
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    setValue('startDate', date.toISOString().split('T')[0], { shouldValidate: true })
                  }
                }}
                disabled={(date: Date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
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
            {...register('maxCapacity', { valueAsNumber: true })}
            className={cn(errors.maxCapacity && 'border-destructive')}
          />
          {errors.maxCapacity && <p className="text-sm text-destructive">{errors.maxCapacity.message}</p>}
        </div>
      </div>

      {/* Hình thức học */}
      <div className="space-y-2">
        <Label>
          Hình thức học <span className="text-destructive">*</span>
        </Label>
        <RadioGroup value={modality} onValueChange={(val: string) => setValue('modality', val as 'ONLINE' | 'OFFLINE' | 'HYBRID', { shouldValidate: true })}>
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
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="HYBRID" id="hybrid" />
              <Label htmlFor="hybrid" className="font-normal cursor-pointer">
                Hybrid (Kết hợp)
              </Label>
            </div>
          </div>
        </RadioGroup>
        {errors.modality && <p className="text-sm text-destructive">{errors.modality.message}</p>}
      </div>

      {/* Ngày học trong tuần */}
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
              />
              <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Chọn ít nhất 1 ngày, tối đa 7 ngày</p>
        {errors.scheduleDays && <p className="text-sm text-destructive">{errors.scheduleDays.message}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex flex-wrap items-center justify-between pt-4 gap-3">
        <Button type="button" variant="ghost" disabled={isLoading} onClick={onCancel}>
          Hủy &amp; về danh sách
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[150px]">
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Đang tạo...
            </>
          ) : (
            'Tạo lớp học'
          )}
        </Button>
      </div>
    </form>
  )
}
