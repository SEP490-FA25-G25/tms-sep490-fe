import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ResourceConflict, ResourceOption } from '@/types/classCreation'
import {
  useAssignSessionResourceMutation,
  useLazyGetSessionResourceSuggestionsQuery,
} from '@/store/services/classCreationApi'
import { AlertCircle, Check, Loader2, RefreshCw, Wand2 } from 'lucide-react'

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

const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
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
  const [bulkResource, setBulkResource] = useState<number | undefined>()
  const [isApplyingBulk, setIsApplyingBulk] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Group conflicts by day of week
  const groupedConflicts = useMemo(() => {
    const groups: Record<number, ResourceConflict[]> = {}
    conflicts.forEach((conflict) => {
      const day = typeof conflict.dayOfWeek === 'number'
        ? conflict.dayOfWeek
        : new Date(conflict.sessionDate || conflict.date || '').getDay()
      if (!groups[day]) groups[day] = []
      groups[day].push(conflict)
    })
    return groups
  }, [conflicts])

  // Get all unique suggestions across all conflicts for bulk selection
  const allSuggestions = useMemo(() => {
    const map = new Map<number, ResourceOption>()
    Object.values(conflictStates).forEach((state) => {
      state.suggestions.forEach((s) => map.set(s.id, s))
    })
    return Array.from(map.values())
  }, [conflictStates])

  // Auto-load suggestions when dialog opens
  useEffect(() => {
    if (!open || conflicts.length === 0) return

    const loadAllSuggestions = async () => {
      setLoadingSuggestions(true)
      const newStates: Record<number, ConflictState> = {}

      // Initialize states first
      conflicts.forEach((conflict) => {
        newStates[conflict.sessionId] = {
          suggestions: conflict.suggestions ?? [],
          selection: conflict.suggestions?.[0]?.id,
          status: 'idle',
        }
      })
      setConflictStates(newStates)

      // Load suggestions for conflicts that don't have them
      const conflictsNeedingSuggestions = conflicts.filter(
        (c) => !c.suggestions || c.suggestions.length === 0
      )

      if (conflictsNeedingSuggestions.length > 0) {
        // Load first one to get suggestions (they should be similar for same day)
        try {
          const first = conflictsNeedingSuggestions[0]
          const result = await fetchSuggestions({ classId, sessionId: first.sessionId }).unwrap()
          const options = result.data ?? []

          // Apply to all conflicts needing suggestions
          setConflictStates((prev) => {
            const updated = { ...prev }
            conflictsNeedingSuggestions.forEach((c) => {
              updated[c.sessionId] = {
                ...updated[c.sessionId],
                suggestions: options,
                selection: options[0]?.id,
              }
            })
            return updated
          })
        } catch {
          // Silently fail, user can manually load
        }
      }

      setLoadingSuggestions(false)
    }

    loadAllSuggestions()
  }, [open, conflicts, classId, fetchSuggestions])

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Không rõ ngày'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getDayLabel = (day: string | number | null | undefined) => {
    if (day === null || day === undefined) return ''
    if (typeof day === 'number') {
      return DAY_LABELS[day] || ''
    }
    return day
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'CAPACITY_EXCEEDED':
        return 'Vượt sức chứa'
      case 'BOOKING_CONFLICT':
      case 'CLASS_BOOKING':
        return 'Trùng lớp khác'
      default:
        return 'Đã có lớp khác'
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
        (error as { data?: { message?: string } })?.data?.message || 'Không thể tải gợi ý'
      toast.error(message)
    }
  }

  const handleAssignResource = useCallback(async (sessionId: number, resourceId?: number) => {
    const state = conflictStates[sessionId]
    const selectedResource = resourceId ?? state?.selection
    if (!selectedResource) {
      toast.error('Vui lòng chọn tài nguyên thay thế')
      return false
    }
    try {
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], status: 'loading', message: undefined },
      }))
      await assignSessionResource({
        classId,
        sessionId,
        data: { resourceId: selectedResource },
      }).unwrap()
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'success',
          message: 'Đã gán',
        },
      }))
      onConflictsChange?.(conflicts.filter((conflict) => conflict.sessionId !== sessionId))
      return true
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || 'Không thể gán tài nguyên'
      setConflictStates((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'error',
          message,
        },
      }))
      return false
    }
  }, [assignSessionResource, classId, conflictStates, conflicts, onConflictsChange])

  const handleApplyToAll = async () => {
    if (!bulkResource) {
      toast.error('Vui lòng chọn tài nguyên để áp dụng')
      return
    }

    setIsApplyingBulk(true)
    let successCount = 0
    let failCount = 0

    for (const conflict of conflicts) {
      const state = conflictStates[conflict.sessionId]
      if (state?.status === 'success') continue // Skip already resolved

      const result = await handleAssignResource(conflict.sessionId, bulkResource)
      if (result) successCount++
      else failCount++
    }

    setIsApplyingBulk(false)

    if (successCount > 0) {
      toast.success(`Đã gán ${successCount} buổi thành công${failCount > 0 ? `, ${failCount} buổi thất bại` : ''}`)
    } else if (failCount > 0) {
      toast.error(`Không thể gán ${failCount} buổi`)
    }
  }

  const totalConflicts = initialCount || conflicts.length
  const resolvedCount = Object.values(conflictStates).filter((s) => s.status === 'success').length
  const remainingCount = conflicts.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Xung đột tài nguyên
              </DialogTitle>
              <DialogDescription className="mt-1">
                {remainingCount} buổi học cần được gán tài nguyên khác
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Đã xử lý {resolvedCount}/{totalConflicts}
            </Badge>
          </div>
        </DialogHeader>

        {/* Bulk Action Bar */}
        {allSuggestions.length > 0 && remainingCount > 1 && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-dashed">
            <Wand2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0">Áp dụng nhanh:</span>
            <Select value={bulkResource?.toString()} onValueChange={(v) => setBulkResource(Number(v))}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Chọn tài nguyên cho tất cả..." />
              </SelectTrigger>
              <SelectContent>
                {allSuggestions.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    <span className="font-medium">{option.displayName || option.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({option.capacity} chỗ)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleApplyToAll}
              disabled={!bulkResource || isApplyingBulk}
              className="shrink-0"
            >
              {isApplyingBulk ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Đang áp dụng...
                </>
              ) : (
                `Áp dụng (${remainingCount})`
              )}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loadingSuggestions && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Đang tải gợi ý tài nguyên...
          </div>
        )}

        {/* Grouped Conflicts */}
        <div className="flex-1 overflow-y-auto py-2">
          {remainingCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-emerald-100 p-3 mb-3">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="font-medium text-emerald-700">Tất cả xung đột đã được xử lý!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bấm "Chạy lại gán tài nguyên" để xác nhận
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={Object.keys(groupedConflicts)} className="space-y-2">
              {Object.entries(groupedConflicts).map(([dayStr, dayConflicts]) => {
                const day = parseInt(dayStr)
                const dayLabel = getDayLabel(day)
                const resolvedInDay = dayConflicts.filter(
                  (c) => conflictStates[c.sessionId]?.status === 'success'
                ).length

                return (
                  <AccordionItem
                    key={day}
                    value={dayStr}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <span className="font-medium">{dayLabel}</span>
                        <Badge variant="secondary" className="text-xs">
                          {dayConflicts.length - resolvedInDay} còn lại
                        </Badge>
                        {resolvedInDay > 0 && (
                          <Badge variant="success" className="text-xs">
                            {resolvedInDay} đã xử lý
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <div className="divide-y">
                        {dayConflicts.map((conflict) => {
                          const state = conflictStates[conflict.sessionId]
                          const isResolved = state?.status === 'success'

                          return (
                            <div
                              key={conflict.sessionId}
                              className={cn(
                                'px-4 py-3 transition-colors',
                                isResolved && 'bg-emerald-50/50'
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Session Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                      Buổi {conflict.sessionNumber || '?'}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      {formatDate(conflict.sessionDate ?? conflict.date)}
                                    </span>
                                    {conflict.timeSlotStart && conflict.timeSlotEnd &&
                                      conflict.timeSlotStart !== 'N/A' && (
                                        <Badge variant="outline" className="text-xs">
                                          {conflict.timeSlotStart} - {conflict.timeSlotEnd}
                                        </Badge>
                                      )}
                                    {isResolved && (
                                      <Badge variant="success" className="text-xs">
                                        <Check className="h-3 w-3 mr-1" />
                                        Đã gán
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-amber-600">{getReasonLabel(String(conflict.conflictReason))}</span>
                                    {conflict.resourceDisplayName || conflict.resourceName
                                      ? ` · ${conflict.resourceDisplayName || conflict.resourceName}`
                                      : ''}
                                    {conflict.conflictingClasses?.length
                                      ? ` · Trùng: ${conflict.conflictingClasses.join(', ')}`
                                      : ''}
                                  </p>
                                </div>

                                {/* Actions */}
                                {!isResolved && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    {state?.suggestions?.length ? (
                                      <>
                                        <Select
                                          value={state.selection?.toString() || ''}
                                          onValueChange={(value) =>
                                            setConflictStates((prev) => ({
                                              ...prev,
                                              [conflict.sessionId]: {
                                                ...prev[conflict.sessionId],
                                                selection: Number(value),
                                              },
                                            }))
                                          }
                                        >
                                          <SelectTrigger className="w-[180px] h-8 text-xs">
                                            <SelectValue placeholder="Chọn tài nguyên" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {state.suggestions.map((option) => (
                                              <SelectItem key={option.id} value={option.id.toString()}>
                                                <span>{option.displayName || option.name}</span>
                                                <span className="text-muted-foreground ml-1">
                                                  ({option.capacity})
                                                </span>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          size="sm"
                                          className="h-8"
                                          onClick={() => handleAssignResource(conflict.sessionId)}
                                          disabled={!state?.selection || state?.status === 'loading'}
                                        >
                                          {state?.status === 'loading' ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            'Gán'
                                          )}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleLoadSuggestions(conflict.sessionId)}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Tải gợi ý
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {state?.message && state.status === 'error' && (
                                <p className="text-xs text-rose-600 mt-2">{state.message}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-4 border-t flex-wrap gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(resolvedCount / Math.max(totalConflicts, 1)) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {resolvedCount}/{totalConflicts}
            </span>
          </div>
          <div className="flex gap-2">
            {onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
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
