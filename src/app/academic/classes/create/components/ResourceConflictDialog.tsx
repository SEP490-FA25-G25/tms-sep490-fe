import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ResourceConflict } from '@/types/classCreation'

interface ResourceConflictDialogProps {
  open: boolean
  conflicts: ResourceConflict[]
  onOpenChange: (open: boolean) => void
}

export function ResourceConflictDialog({ open, conflicts, onOpenChange }: ResourceConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xung đột tài nguyên</DialogTitle>
          <DialogDescription>
            Một số buổi học không thể gán tài nguyên vì đã có lớp khác hoặc vượt quá sức chứa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {conflicts.map((conflict) => (
            <div key={conflict.sessionId} className="rounded-lg border border-border/60 p-3">
              <p className="text-sm font-semibold">
                Buổi #{conflict.sessionId} · {conflict.sessionDate}
              </p>
              <p className="text-xs text-muted-foreground">
                Lý do: {conflict.conflictReason === 'CAPACITY_EXCEEDED' ? 'Vượt sức chứa' : conflict.conflictReason === 'BOOKING_CONFLICT' ? 'Đã có lớp khác' : 'Không xác định'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tài nguyên: {conflict.resourceName} · Yêu cầu {conflict.requestedCapacity} / khả dụng {conflict.availableCapacity}
              </p>
              {conflict.conflictingClasses.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Trùng với: {conflict.conflictingClasses.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
