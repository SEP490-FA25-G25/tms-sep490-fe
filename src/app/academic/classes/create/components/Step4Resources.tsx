import { useEffect, useMemo, useState } from 'react'
import { useAssignResourcesMutation, useLazyGetResourcesQuery, useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ResourceConflictDialog } from './ResourceConflictDialog'
import { toast } from 'sonner'
import { AlertCircle, Check } from 'lucide-react'
import type { AssignResourcesRequest, ResourceConflict, ResourceOption } from '@/types/classCreation'

interface Step4ResourcesProps {
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

export function Step4Resources({ classId, onContinue }: Step4ResourcesProps) {
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, { skip: !classId })
  const { data: sessionsData, refetch: refetchSessions } = useGetClassSessionsQuery(classId ?? 0, { skip: !classId })
  const scheduleDays = classDetail?.data?.scheduleDays ?? DEFAULT_DAYS
  const sortedDays = useMemo(() => Array.from(new Set(scheduleDays)).sort(), [scheduleDays])

  // Derive timeSlotSelections from sessions
  const timeSlotSelections = useMemo(() => {
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
    const result: Record<number, number> = {}
    sortedDays.forEach((day) => {
      const slotCounts = dayToSlots[day]
      if (slotCounts) {
        const best = Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]
        if (best) result[day] = Number(best[0])
      }
    })
    return result
  }, [sortedDays, sessionsData])

  const [fetchResources] = useLazyGetResourcesQuery()
  const [assignResources, { isLoading: isSubmitting }] = useAssignResourcesMutation()
  const [resourcesByDay, setResourcesByDay] = useState<Record<number, ResourceOption[]>>({})
  const [isLoadingResources, setIsLoadingResources] = useState(false)

  const [selectedResources, setSelectedResources] = useState<Record<number, number | ''>>({})
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([])
  const [initialConflictCount, setInitialConflictCount] = useState(0)
  const [lastPattern, setLastPattern] = useState<AssignResourcesRequest['pattern']>([])

  const totalSessions = sessionsData?.data?.totalSessions ?? 0
  const assignedCount = sortedDays.filter(day => selectedResources[day]).length
  const allAssigned = assignedCount === sortedDays.length
  const hasTimeSlots = Object.keys(timeSlotSelections).length > 0

  // Prefill from existing sessions
  useEffect(() => {
    const initial: Record<number, number | ''> = {}
    const sessions = sessionsData?.data?.sessions ?? []
    const dayToResource: Record<number, Record<number, number>> = {}
    sessions.forEach((session) => {
      if (!session.date) return
      const day = new Date(session.date).getDay()
      const resourceId = session.resourceId
      if (!resourceId) return
      if (!dayToResource[day]) dayToResource[day] = {}
      dayToResource[day][resourceId] = (dayToResource[day][resourceId] || 0) + 1
    })
    sortedDays.forEach((day) => {
      const counts = dayToResource[day]
      if (counts) {
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        initial[day] = best ? Number(best[0]) : ''
      } else {
        initial[day] = ''
      }
    })
    setSelectedResources(initial)
  }, [sortedDays, sessionsData])

  // Fetch resources
  useEffect(() => {
    if (!classId) return
    const daysToFetch = sortedDays.filter((day) => timeSlotSelections[day])
    if (daysToFetch.length === 0) return
    let isMounted = true
    setIsLoadingResources(true)

    Promise.all(
      daysToFetch.map(async (day) => {
        try {
          const result = await fetchResources({
            classId,
            timeSlotId: timeSlotSelections[day],
            dayOfWeek: day,
          }).unwrap()
          return [day, result.data ?? []] as [number, ResourceOption[]]
        } catch {
          return [day, []] as [number, ResourceOption[]]
        }
      })
    ).then((entries) => {
      if (!isMounted) return
      const map: Record<number, ResourceOption[]> = {}
      entries.forEach(([day, list]) => {
        map[day] = list
      })
      setResourcesByDay(map)
      setIsLoadingResources(false)
    })

    return () => { isMounted = false }
  }, [classId, fetchResources, sortedDays, timeSlotSelections])

  const handleChange = (day: number, value: string) => {
    setSelectedResources((prev) => ({
      ...prev,
      [day]: value ? Number(value) : '',
    }))
  }

  const buildPatternFromState = () => {
    return Object.entries(selectedResources)
      .filter(([, value]) => value)
      .map(([day, resourceId]) => ({
        dayOfWeek: Number(day),
        resourceId: Number(resourceId),
      }))
  }

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('Không tìm thấy lớp học.')
      return
    }

    const pattern = buildPatternFromState()
    if (pattern.length === 0) {
      toast.error('Vui lòng chọn tài nguyên cho ít nhất 1 ngày.')
      return
    }
    setLastPattern(pattern)

    try {
      const response = await assignResources({
        classId,
        data: { pattern, skipConflictCheck: false },
      }).unwrap()

      if (response.data?.conflicts && response.data.conflicts.length > 0) {
        setConflicts(response.data.conflicts)
        setInitialConflictCount(response.data.conflicts.length)
        toast.info(`Phát hiện ${response.data.conflicts.length} xung đột.`)
      } else {
        toast.success('Đã lưu tài nguyên thành công')
        refetchSessions()
        onContinue()
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể lưu tài nguyên.'
      toast.error(message)
    }
  }

  const handleRetryConflicts = async () => {
    if (!classId || lastPattern.length === 0) return
    try {
      const response = await assignResources({
        classId,
        data: { pattern: lastPattern, skipConflictCheck: true },
      }).unwrap()

      if (response.data?.conflicts && response.data.conflicts.length > 0) {
        setConflicts(response.data.conflicts)
        setInitialConflictCount(response.data.conflicts.length)
      } else {
        toast.success('Đã lưu tài nguyên thành công')
        setConflicts([])
        setInitialConflictCount(0)
        refetchSessions()
        onContinue()
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể lưu tài nguyên.'
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

  if (!hasTimeSlots) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vui lòng hoàn thành Bước 3 (gán khung giờ) trước.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoadingResources) {
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
        <h2 className="text-xl font-semibold">Gán phòng học / tài khoản online</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chọn tài nguyên cho {sortedDays.length} ngày học • {totalSessions} buổi
        </p>
      </div>

      {/* Resource Selection */}
      <div className="rounded-lg border">
        <div className="px-4 py-3 border-b bg-muted/30">
          <span className="font-medium">Chọn tài nguyên theo ngày</span>
        </div>

        <div className="divide-y">
          {sortedDays.map((day) => {
            const options = resourcesByDay[day] || []
            const isSelected = Boolean(selectedResources[day])

            return (
              <div key={day} className="flex items-center gap-4 px-4 py-3">
                <div className="w-24 font-medium">{DAY_LABELS[day]}</div>

                <div className="flex-1">
                  {options.length > 0 ? (
                    <Select
                      value={selectedResources[day]?.toString() || ''}
                      onValueChange={(value) => handleChange(day, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phòng / tài khoản..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id.toString()}>
                            {resource.displayName || resource.name}
                            {resource.availabilityRate !== undefined && (
                              <span className="text-muted-foreground ml-2">
                                ({resource.availabilityRate.toFixed(0)}%)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">Không có tài nguyên khả dụng</span>
                  )}
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Đã chọn {assignedCount}/{sortedDays.length} ngày
        </p>
        <Button onClick={handleSubmit} disabled={isSubmitting || !allAssigned}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu tài nguyên'}
        </Button>
      </div>

      {/* Conflict Dialog */}
      {classId && conflicts.length > 0 && (
        <ResourceConflictDialog
          open={conflicts.length > 0}
          conflicts={conflicts}
          classId={classId}
          initialCount={initialConflictCount}
          onConflictsChange={(updated) => setConflicts(updated)}
          onOpenChange={(open) => {
            if (!open) {
              setConflicts([])
              setInitialConflictCount(0)
            }
          }}
          onRetry={handleRetryConflicts}
        />
      )}
    </div>
  )
}
