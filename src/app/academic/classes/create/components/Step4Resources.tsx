import { useEffect, useMemo, useState } from 'react'
import { useAssignResourcesMutation, useLazyGetResourcesQuery } from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WizardFooter } from './WizardFooter'
import { ResourceConflictDialog } from './ResourceConflictDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AssignResourcesRequest, ResourceConflict, ResourceOption } from '@/types/classCreation'

interface Step4ResourcesProps {
  classId: number | null
  timeSlotSelections: Record<number, number>
  onBack: () => void
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

function ResourceMeta({ resource, muted = false }: { resource: ResourceOption; muted?: boolean }) {
  return (
    <div className={cn('flex flex-col text-xs text-muted-foreground', muted && 'opacity-80')}>
      <span className="flex flex-wrap items-center gap-2">
        {resource.resourceType === 'ROOM' ? 'Phòng học' : 'Tài khoản online'}
        {typeof resource.availabilityRate === 'number' && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              resource.availabilityRate >= 90
                ? 'bg-emerald-50 text-emerald-600'
                : resource.availabilityRate >= 70
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
            )}
          >
            {resource.availabilityRate.toFixed(0)}% khả dụng
          </span>
        )}
        {resource.isRecommended && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Khuyến nghị
          </span>
        )}
      </span>
      {resource.conflictCount !== undefined && resource.totalSessions !== undefined && (
        <span className="text-[11px] text-muted-foreground">
          {resource.conflictCount} xung đột / {resource.totalSessions} buổi
        </span>
      )}
    </div>
  )
}

function SelectedResourceSummary({ resource }: { resource: ResourceOption }) {
  return (
    <div className="mt-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Đã chọn</span>
      <p className="text-sm font-semibold text-foreground">{resource.displayName || resource.name}</p>
      <ResourceMeta resource={resource} muted />
    </div>
  )
}

export function Step4Resources({ classId, timeSlotSelections, onBack, onContinue }: Step4ResourcesProps) {
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, { skip: !classId })
  const scheduleDays = classDetail?.data?.scheduleDays ?? DEFAULT_DAYS
  const sortedDays = useMemo(() => Array.from(new Set(scheduleDays)).sort(), [scheduleDays])

  const [fetchResources] = useLazyGetResourcesQuery()
  const [assignResources, { isLoading: isSubmitting }] = useAssignResourcesMutation()
  const [resourcesByDay, setResourcesByDay] = useState<Record<number, ResourceOption[]>>({})
  const [resourceLookup, setResourceLookup] = useState<Record<number, ResourceOption>>({})
  const [isLoadingResources, setIsLoadingResources] = useState(false)

  const [selectedResources, setSelectedResources] = useState<Record<number, number | ''>>({})
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([])
  const [initialConflictCount, setInitialConflictCount] = useState(0)
  const [lastPattern, setLastPattern] = useState<AssignResourcesRequest['pattern']>([])

  useEffect(() => {
    const initial: Record<number, number | ''> = {}
    sortedDays.forEach((day) => {
      initial[day] = ''
    })
    setSelectedResources(initial)
  }, [sortedDays])

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
          return [day, result.data ?? []] as const
        } catch {
          return [day, []] as const
        }
      })
    ).then((entries) => {
      if (!isMounted) return
      const map: Record<number, ResourceOption[]> = {}
      const lookup: Record<number, ResourceOption> = {}
      entries.forEach(([day, list]) => {
        map[day] = list
        list.forEach((resource) => {
          lookup[resource.id] = resource
        })
      })
      setResourcesByDay(map)
      setResourceLookup(lookup)
      setIsLoadingResources(false)
    })

    return () => {
      isMounted = false
    }
  }, [classId, fetchResources, sortedDays, timeSlotSelections])

  const handleChange = (day: number, value: string) => {
    setSelectedResources((prev) => ({
      ...prev,
      [day]: value ? Number(value) : '',
    }))
  }

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('Không tìm thấy lớp học. Vui lòng quay lại bước 1.')
      return
    }

    const pattern = Object.entries(selectedResources)
      .filter(([, value]) => value)
      .map(([day, value]) => ({
        dayOfWeek: Number(day),
        resourceId: Number(value),
      }))

    if (pattern.length === 0) {
      toast.error('Vui lòng chọn tài nguyên cho ít nhất 1 ngày học.')
      return
    }

    setLastPattern(pattern)

    try {
      const response = await assignResources({ classId, data: { pattern } }).unwrap()
      if (response.data.conflictCount > 0) {
        const conflictList = response.data.conflicts ?? []
        setConflicts(conflictList)
        setInitialConflictCount(conflictList.length)
        toast.warning('Một số buổi học bị xung đột tài nguyên')
      } else {
        setConflicts([])
        setInitialConflictCount(0)
        toast.success(response.message || 'Đã gán tài nguyên thành công')
        onContinue()
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể gán tài nguyên. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const buildPatternFromState = () =>
    Object.entries(selectedResources)
      .filter(([, value]) => value)
      .map(([day, value]) => ({
        dayOfWeek: Number(day),
        resourceId: Number(value),
      }))

  const handleRetryConflicts = async () => {
    if (!classId) {
      setConflicts([])
      return
    }
    const pattern =
      lastPattern.length > 0
        ? lastPattern
        : buildPatternFromState()
    if (pattern.length === 0) {
      setConflicts([])
      return
    }
    if (lastPattern.length === 0) {
      setLastPattern(pattern)
    }
    try {
      const response = await assignResources({ classId, data: { pattern } }).unwrap()
      if (response.data.conflictCount > 0) {
        const conflictList = response.data.conflicts ?? []
        setConflicts(conflictList)
        setInitialConflictCount((prev) => (prev === 0 ? conflictList.length : prev))
        toast.warning('Vẫn còn buổi chưa gán tài nguyên. Vui lòng tiếp tục xử lý.')
      } else {
        setConflicts([])
        setInitialConflictCount(0)
        toast.success(response.message || 'Đã gán tài nguyên thành công')
        onContinue()
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể gán tài nguyên. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  if (!classId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Vui lòng tạo lớp (Bước 1) trước khi gán tài nguyên.</AlertDescription>
        </Alert>
        <WizardFooter currentStep={4} isFirstStep={false} isLastStep={false} onBack={onBack} onNext={onContinue} isNextDisabled />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gán phòng học / tài khoản online theo ngày</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hệ thống sử dụng phương pháp HYBRID: gán theo pattern ngày. Bạn có thể điều chỉnh từng buổi sau nếu cần.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(timeSlotSelections).length === 0 ? (
            <Alert>
              <AlertDescription>
                Chưa có dữ liệu khung giờ từ bước trước. Vui lòng quay lại Bước 3 và gán khung giờ cho từng ngày.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {sortedDays.map((day) => {
                const slotId = timeSlotSelections[day]
                const options = resourcesByDay[day]
                const selectedResource = selectedResources[day]
                  ? resourceLookup[selectedResources[day] as number]
                  : null
                return (
                  <div key={day} className="rounded-2xl border border-border/70 bg-card/30 p-4">
                    {!slotId ? (
                      <Alert>
                        <AlertDescription>Ngày này chưa được chọn khung giờ ở Bước 3.</AlertDescription>
                      </Alert>
                    ) : isLoadingResources && !options ? (
                      <Skeleton className="h-14 rounded-xl" />
                    ) : options && options.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Ngày học</span>
                            <p className="text-base font-semibold text-foreground">{DAY_LABELS[day] || `Ngày ${day}`}</p>
                          </div>
                          <Select value={selectedResources[day]?.toString() || ''} onValueChange={(value) => handleChange(day, value)}>
                            <SelectTrigger
                              className="h-11 w-full justify-between rounded-xl border-border/70 bg-background px-4 text-sm font-medium text-foreground md:w-80"
                              aria-label={`Chọn tài nguyên cho ${DAY_LABELS[day] || `Ngày ${day}`}`}
                            >
                              {selectedResource ? (
                                <span className="truncate">{selectedResource.displayName || selectedResource.name}</span>
                              ) : (
                                <span className="text-muted-foreground">Chọn tài nguyên</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((resource) => (
                                <SelectItem key={resource.id} value={resource.id.toString()} className="py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">{resource.displayName || resource.name}</span>
                                    <ResourceMeta resource={resource} />
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedResource && <SelectedResourceSummary resource={selectedResource} />}
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          Không tìm thấy tài nguyên phù hợp cho ngày này. Hãy thử khung giờ khác hoặc thêm tài nguyên mới.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <WizardFooter
        currentStep={4}
        isFirstStep={false}
        isLastStep={false}
        onBack={onBack}
        onNext={handleSubmit}
        isSubmitting={isSubmitting}
        nextButtonText="Lưu tài nguyên"
      />

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
