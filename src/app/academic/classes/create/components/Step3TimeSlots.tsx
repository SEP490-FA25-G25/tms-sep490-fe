import { useEffect, useMemo, useState } from 'react'
import { useAssignTimeSlotsMutation, useGetTimeSlotsQuery, useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Check, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Step3TimeSlotsProps {
  classId: number | null
  onContinue: () => void
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

/**
 * Calculate duration in hours from startTime and endTime (HH:mm format)
 */
function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return (endMinutes - startMinutes) / 60
}

export function Step3TimeSlots({ classId, onContinue }: Step3TimeSlotsProps) {
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, { skip: !classId })
  const { data: sessionsData, isLoading: isSessionsLoading, refetch: refetchSessions } = useGetClassSessionsQuery(classId ?? 0, { skip: !classId })
  const branchId = classDetail?.data?.branch?.id
  const hoursPerSession = classDetail?.data?.subject?.hoursPerSession

  const { data: timeSlotResponse, isLoading: isTimeSlotLoading } = useGetTimeSlotsQuery(
    branchId ? { branchId } : { branchId: 0 },
    { skip: !branchId }
  )
  const [assignTimeSlots, { isLoading: isSubmitting }] = useAssignTimeSlotsMutation()

  const scheduleDays = classDetail?.data?.scheduleDays ?? DEFAULT_DAYS
  const sortedDays = useMemo(() => Array.from(new Set(scheduleDays)).sort(), [scheduleDays])

  const [selectedSlots, setSelectedSlots] = useState<Record<number, number | ''>>({})

  // Filter time slots by duration matching hoursPerSession
  const filteredTimeSlots = useMemo(() => {
    const allSlots = timeSlotResponse?.data ?? []

    if (!hoursPerSession) {
      return allSlots
    }

    return allSlots.filter(slot => {
      const duration = calculateDurationHours(slot.startTime, slot.endTime)
      // Allow small tolerance for floating point comparison (0.01 hours = ~36 seconds)
      return Math.abs(duration - hoursPerSession) < 0.01
    })
  }, [timeSlotResponse, hoursPerSession])

  // Prefill from existing sessions
  useEffect(() => {
    const initial: Record<number, number | ''> = {}
    const sessions = sessionsData?.data?.sessions ?? []
    const dayToSlots: Record<number, Record<number, number>> = {}

    sessions.forEach((session) => {
      if (!session.date) return
      const day = new Date(session.date).getDay()
      const slotId = session.timeSlotTemplateId
      if (!slotId) return
      if (!dayToSlots[day]) dayToSlots[day] = {}
      dayToSlots[day][slotId] = (dayToSlots[day][slotId] || 0) + 1
    })

    sortedDays.forEach((day) => {
      const slotCounts = dayToSlots[day]
      if (slotCounts) {
        const best = Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]
        initial[day] = best ? Number(best[0]) : ''
      } else {
        initial[day] = ''
      }
    })
    setSelectedSlots(initial)
  }, [sortedDays, sessionsData])

  const totalSessions = sessionsData?.data?.totalSessions ?? 0
  const assignedCount = sortedDays.filter(day => selectedSlots[day]).length
  const allAssigned = assignedCount === sortedDays.length

  const handleChange = (day: number, value: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [day]: value ? Number(value) : '',
    }))
  }

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('Không tìm thấy lớp học.')
      return
    }

    const assignments = Object.entries(selectedSlots)
      .filter(([, value]) => value)
      .map(([day, value]) => ({
        dayOfWeek: Number(day),
        timeSlotTemplateId: Number(value),
      }))

    if (assignments.length === 0) {
      toast.error('Vui lòng chọn khung giờ cho ít nhất 1 ngày.')
      return
    }

    try {
      const response = await assignTimeSlots({ classId, data: { assignments } }).unwrap()
      toast.success(response.message || 'Đã lưu khung giờ')
      refetchSessions()
      onContinue()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể lưu khung giờ.'
      toast.error(message)
    }
  }

  if (!classId) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vui lòng hoàn thành Bước 1 trước.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isTimeSlotLoading || isSessionsLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Gán khung giờ</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chọn khung giờ cho {sortedDays.length} ngày học • {totalSessions} buổi
        </p>
      </div>

      {/* Info about filtered time slots */}
      {hoursPerSession && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Hiển thị các khung giờ có thời lượng <strong>{hoursPerSession}h</strong> phù hợp với khóa học.
            {filteredTimeSlots.length === 0 && (
              <span className="block mt-1 text-amber-700">
                ⚠️ Không có khung giờ nào phù hợp. Vui lòng liên hệ quản trị viên để tạo khung giờ mới.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Time Slot Selection */}
      <div className="rounded-lg border">
        <div className="px-4 py-3 border-b bg-muted/30">
          <span className="font-medium">Chọn khung giờ theo ngày</span>
        </div>

        <div className="divide-y">
          {sortedDays.map((day) => {
            const isSelected = Boolean(selectedSlots[day])

            return (
              <div key={day} className="flex items-center gap-4 px-4 py-3">
                <div className="w-24 font-medium">{DAY_LABELS[day]}</div>

                <div className="flex-1">
                  <Select
                    value={selectedSlots[day]?.toString() || ''}
                    onValueChange={(value) => handleChange(day, value)}
                    disabled={filteredTimeSlots.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={filteredTimeSlots.length === 0 ? "Không có khung giờ phù hợp" : "Chọn khung giờ..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTimeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.startTime} - {slot.endTime} ({slot.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-20 text-right">
                  {isSelected ? (
                    <span className="text-sm text-green-600 flex items-center justify-end gap-1">
                      <Check className="h-4 w-4" /> Đã chọn
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa chọn</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status - Button removed, save is handled via Wizard's "Tiếp theo" */}
      <div className="flex items-center justify-end">
        <p className="text-sm text-muted-foreground">
          Đã chọn {assignedCount}/{sortedDays.length} ngày
          {allAssigned && <span className="ml-2 text-green-600">✓ Sẵn sàng</span>}
        </p>
      </div>

      {/* Hidden submit button triggered by wizard */}
      <button
        id="step3-submit-btn"
        type="button"
        onClick={handleSubmit}
        className="hidden"
        disabled={isSubmitting || !allAssigned}
      />
    </div>
  )
}
