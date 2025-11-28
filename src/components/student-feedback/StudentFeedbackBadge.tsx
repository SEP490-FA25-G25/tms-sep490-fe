import { MessageCircleIcon } from 'lucide-react'

import { useGetPendingCountQuery } from '@/store/services/studentFeedbackApi'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function StudentFeedbackBadge() {
  const { data: count, isLoading } = useGetPendingCountQuery()
  const displayCount = typeof count === 'number' && count > 99 ? '99+' : count ?? 0

  return (
    <div className="relative inline-flex items-center gap-2 text-sm text-muted-foreground">
      <MessageCircleIcon className="h-4 w-4" />
      <span>Phản hồi</span>
      <span
        className={cn(
          'flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold',
          isLoading
            ? 'bg-muted text-muted-foreground'
            : displayCount
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {isLoading ? '…' : displayCount}
      </span>
    </div>
  )
}

export function StudentFeedbackNavBadge() {
  const { data: count, isLoading } = useGetPendingCountQuery()
  const displayCount = typeof count === 'number' && count > 99 ? '99+' : count ?? 0

  // Chỉ hiển thị khi có dữ liệu hoặc đang loading (giống cách hiển thị badge Thông báo)
  if (!isLoading && (!displayCount || displayCount === 0)) {
    return null
  }

  const badgeContent = isLoading ? '…' : displayCount

  return (
    <Badge
      variant="destructive"
      className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
    >
      {badgeContent}
    </Badge>
  )
}
