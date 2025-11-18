import { useEffect, useMemo, useState } from 'react'
import { useAssignTimeSlotsMutation, useGetTimeSlotsQuery } from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WizardFooter } from './WizardFooter'
import { toast } from 'sonner'

interface Step3TimeSlotsProps {
  classId: number | null
  onBack: () => void
  onContinue: () => void
  onSaveSelections: (selections: Record<number, number>) => void
}

const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
}

const DEFAULT_DAYS = [1, 3, 5]

export function Step3TimeSlots({ classId, onBack, onContinue, onSaveSelections }: Step3TimeSlotsProps) {
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, {
    skip: !classId,
  })
  const branchId = classDetail?.data?.branch?.id
  const { data: timeSlotResponse, isLoading: isTimeSlotLoading } = useGetTimeSlotsQuery(
    branchId ? { branchId } : { branchId: 0 },
    {
      skip: !branchId,
    }
  )
  const [assignTimeSlots, { isLoading: isSubmitting }] = useAssignTimeSlotsMutation()

  const scheduleDays = classDetail?.data?.scheduleDays ?? DEFAULT_DAYS
  const sortedDays = useMemo(() => Array.from(new Set(scheduleDays)).sort(), [scheduleDays])

  const [selectedSlots, setSelectedSlots] = useState<Record<number, number | ''>>({})

  useEffect(() => {
    const initial: Record<number, number | ''> = {}
    sortedDays.forEach((day) => {
      initial[day] = ''
    })
    setSelectedSlots(initial)
  }, [sortedDays])

  const timeSlotOptions = timeSlotResponse?.data ?? []

  const handleChange = (day: number, value: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [day]: value ? Number(value) : '',
    }))
  }

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('Không tìm thấy lớp học. Vui lòng quay lại bước 1.')
      return
    }

    const assignments = Object.entries(selectedSlots)
      .filter(([, value]) => value)
      .map(([day, value]) => ({
        dayOfWeek: Number(day),
        timeSlotTemplateId: Number(value),
      }))

    if (assignments.length === 0) {
      toast.error('Vui lòng chọn khung giờ cho ít nhất 1 ngày học.')
      return
    }

    try {
      const response = await assignTimeSlots({ classId, data: { assignments } }).unwrap()
      const savedSelections = assignments.reduce<Record<number, number>>((acc, current) => {
        acc[current.dayOfWeek] = current.timeSlotTemplateId
        return acc
      }, {})
      onSaveSelections(savedSelections)
      toast.success(response.message || 'Đã gán khung giờ thành công')
      onContinue()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể gán khung giờ. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  if (!classId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Vui lòng tạo lớp (Bước 1) trước khi gán khung giờ.</AlertDescription>
        </Alert>
        <WizardFooter currentStep={3} isFirstStep={false} isLastStep={false} onBack={onBack} onNext={onContinue} isNextDisabled />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chọn khung giờ cho từng ngày học</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hệ thống sẽ áp dụng khung giờ theo ngày trong tuần cho toàn bộ buổi học tương ứng.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTimeSlotLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedDays.map((day) => (
                <div key={day} className="space-y-2">
                  <Label className="text-sm font-medium">{DAY_LABELS[day] || `Ngày ${day}`}</Label>
                  <Select value={selectedSlots[day]?.toString() || ''} onValueChange={(value) => handleChange(day, value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn khung giờ" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlotOptions.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.name} ({slot.startTime} - {slot.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WizardFooter
        currentStep={3}
        isFirstStep={false}
        isLastStep={false}
        onBack={onBack}
        onNext={handleSubmit}
        isSubmitting={isSubmitting}
        nextButtonText="Lưu khung giờ"
      />
    </div>
  )
}
