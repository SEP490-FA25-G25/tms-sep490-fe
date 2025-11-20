import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ResourceConflict, ResourceOption } from '@/types/classCreation'
import {
  useAssignSessionResourceMutation,
  useLazyGetSessionResourceSuggestionsQuery,
} from '@/store/services/classCreationApi'

interface ResourceConflictDialogProps {
  open: boolean
  conflicts: ResourceConflict[]
  onOpenChange: (open: boolean) => void
  classId: number
  onConflictsChange?: (updated: ResourceConflict[]) => void
  onRetry?: () => void
  initialCount?: number
}

type ConflictState = {
  suggestions: ResourceOption[]
  selection?: number
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export function ResourceConflictDialog({
  open,
  conflicts,
  onOpenChange,
  classId,
  onConflictsChange,
  onRetry,
  initialCount = 0,
}: ResourceConflictDialogProps) {
  const [assignSessionResource] = useAssignSessionResourceMutation()
  const [fetchSuggestions] = useLazyGetSessionResourceSuggestionsQuery()
  const [conflictStates, setConflictStates] = useState<Record<number, ConflictState>>({})

  useEffect(() => {
    const map: Record<number, ConflictState> = {}
    conflicts.forEach((conflict) => {
      map[conflict.sessionId] = {
        suggestions: conflict.suggestions ?? [],
        selection: conflict.suggestions?.[0]?.id,
        status: 'idle',
        message: undefined,
      }
    })
    setConflictStates(map)
  }, [conflicts])

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Không rõ ngày'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  const getDayLabel = (day: string | number | null | undefined) => {
    if (day === null || day === undefined) return ''
    if (typeof day === 'number') {
      const labels = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
      return labels[(day + 7) % 7]
    }
    return day
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'CAPACITY_EXCEEDED':
        return 'Vượt sức chứa'
      case 'BOOKING_CONFLICT':
        return 'Đã có lớp khác'
      default:
        return reason || 'Không xác định'
    }
  }

  const handleLoadSuggestions = async (sessionId: number) => {
    try {
      const result = await fetchSuggestions({ classId, sessionId }).unwrap()
      const options = result.data ?? []
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          suggestions: options,
          selection: options[0]?.id,
          status: 'idle',
          message: options.length === 0 ? 'Không tìm thấy tài nguyên phù hợp' : undefined,
        },
      }))
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || 'Không thể tải gợi ý tài nguyên. Vui lòng thử lại.'
      toast.error(message)
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          suggestions: prev[sessionId]?.suggestions ?? [],
          selection: prev[sessionId]?.selection,
          status: 'error',
          message,
        },
      }))
    }
  }

  const handleAssignResource = async (sessionId: number) => {
    const state = conflictStates[sessionId]
    if (!state?.selection) {
      toast.error('Vui lòng chọn tài nguyên thay thế')
      return
    }
    try {
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], status: 'loading', message: undefined },
      }))
      const response = await assignSessionResource({
        classId,
        sessionId,
        data: { resourceId: state.selection },
      }).unwrap()
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'success',
          message: response.message || 'Đã gán tài nguyên mới',
        },
      }))
      onConflictsChange?.(conflicts.filter((conflict) => conflict.sessionId !== sessionId))
      toast.success(response.message || 'Đã gán tài nguyên mới cho buổi học')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || 'Không thể gán tài nguyên. Vui lòng thử lại.'
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'error',
          message,
        },
      }))
      toast.error(message)
    }
  }

  const totalConflicts = initialCount || conflicts.length
  const resolvedCount = Math.max(totalConflicts - conflicts.length, 0)

  const renderSuggestionSummary = (resource?: ResourceOption) => {
    if (!resource) return null
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">{resource.displayName || resource.name}</p>
        <p>
          Loại: {resource.resourceType === 'ROOM' ? 'Phòng học' : 'Tài khoản online'} · Sức chứa {resource.capacity}
        </p>
        {typeof resource.availabilityRate === 'number' && <p>Tỷ lệ khả dụng: {resource.availabilityRate.toFixed(0)}%</p>}
        {resource.conflictCount !== undefined && resource.totalSessions !== undefined && (
          <p>
            {resource.conflictCount} xung đột / {resource.totalSessions} buổi
          </p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xung đột tài nguyên</DialogTitle>
          <DialogDescription>
            Một số buổi học không thể gán tài nguyên vì đã có lớp khác hoặc vượt quá sức chứa. Chọn tài nguyên thay thế
            để giải quyết nhanh.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {conflicts.map((conflict) => {
            const state = conflictStates[conflict.sessionId]
            const selectedSuggestion = state?.suggestions.find((option) => option.id === state.selection)
            return (
              <div key={conflict.sessionId} className="space-y-3 rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      Buổi #{conflict.sessionNumber ?? conflict.sessionId} · {formatDate(conflict.sessionDate ?? conflict.date)}{' '}
                      {getDayLabel(conflict.dayOfWeek) ? `(${getDayLabel(conflict.dayOfWeek)})` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lý do: {getReasonLabel(String(conflict.conflictReason))}
                    </p>
                    {conflict.timeSlotStart && conflict.timeSlotEnd && (
                      <p className="text-xs text-muted-foreground">
                        Khung giờ: {conflict.timeSlotStart} - {conflict.timeSlotEnd}
                      </p>
                    )}
                    {conflict.resourceName && (
                      <p className="text-xs text-muted-foreground">Tài nguyên hiện tại: {conflict.resourceName}</p>
                    )}
                  </div>
                  {state?.status === 'success' && <Badge className="bg-emerald-600 text-white">Đã gán</Badge>}
                </div>

                {state?.suggestions?.length ? (
                  <Select
                    value={state.selection?.toString() || ''}
                    onValueChange={(value) =>
                      setConflictStates((prev) => ({
                        ...prev,
                        [conflict.sessionId]: { ...prev[conflict.sessionId], selection: Number(value) },
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background text-sm font-medium">
                      {selectedSuggestion ? selectedSuggestion.displayName || selectedSuggestion.name : 'Chọn tài nguyên thay thế'}
                    </SelectTrigger>
                    <SelectContent>
                      {state.suggestions.map((option) => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{option.displayName || option.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {option.resourceType === 'ROOM' ? 'Phòng học' : 'Online'} · Sức chứa {option.capacity}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleLoadSuggestions(conflict.sessionId)}>
                    Tải gợi ý tài nguyên
                  </Button>
                )}

                {selectedSuggestion && renderSuggestionSummary(selectedSuggestion)}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleAssignResource(conflict.sessionId)}
                    disabled={!state?.selection || state?.status === 'loading'}
                  >
                    {state?.status === 'loading' ? 'Đang gán…' : 'Gán tài nguyên'}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={state?.status === 'loading'}
                    onClick={() => handleLoadSuggestions(conflict.sessionId)}
                  >
                    Làm mới gợi ý
                  </Button>
                </div>

                {state?.message && (
                  <p
                    className={cn(
                      'text-xs',
                      state.status === 'success' ? 'text-emerald-600' : state.status === 'error' ? 'text-rose-600' : 'text-muted-foreground'
                    )}
                  >
                    {state.message}
                  </p>
                )}

                {conflict.conflictingClasses && conflict.conflictingClasses.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Trùng với: {conflict.conflictingClasses.join(', ')}
                  </p>
                )}
              </div>
            )
          })}
          {conflicts.length === 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-700">
              Tất cả xung đột đã được xử lý. Bấm &quot;Chạy lại gán tài nguyên&quot; để xác nhận.
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Đã xử lý {resolvedCount}/{totalConflicts || 1} buổi
          </p>
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                Chạy lại gán tài nguyên
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
