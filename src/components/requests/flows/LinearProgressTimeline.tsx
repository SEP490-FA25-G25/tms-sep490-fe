import { useMemo } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionInfo } from '@/store/services/studentRequestApi'

interface LinearProgressTimelineProps {
  currentClassSessions: SessionInfo[]
  targetClassSessions: SessionInfo[]
  currentClassCode: string
  targetClassCode: string
}

export default function LinearProgressTimeline({
  currentClassSessions,
  targetClassSessions,
  currentClassCode,
  targetClassCode
}: LinearProgressTimelineProps) {
  // Tính progress của lớp hiện tại
  const currentProgress = useMemo(() => {
    const completedCount = currentClassSessions.filter(s => s.status === 'DONE').length
    const totalCount = currentClassSessions.length
    const nextSession = currentClassSessions.find(s => s.status === 'PLANNED')
    
    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      nextSession
    }
  }, [currentClassSessions])

  // Tính progress của lớp mục tiêu
  const targetProgress = useMemo(() => {
    const completedCount = targetClassSessions.filter(s => s.status === 'DONE').length
    const totalCount = targetClassSessions.length
    const nextSession = targetClassSessions.find(s => s.status === 'PLANNED')
    
    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      nextSession
    }
  }, [targetClassSessions])

  // Tính gap ngày giữa 2 lớp
  const dateGap = useMemo(() => {
    if (!currentProgress.nextSession || !targetProgress.nextSession) {
      return null
    }
    
    const currentDate = parseISO(currentProgress.nextSession.date)
    const targetDate = parseISO(targetProgress.nextSession.date)
    const gap = differenceInDays(targetDate, currentDate)
    
    return {
      days: Math.abs(gap),
      direction: gap > 0 ? 'later' : gap < 0 ? 'earlier' : 'same',
      currentDate: format(currentDate, 'dd/MM', { locale: vi }),
      targetDate: format(targetDate, 'dd/MM', { locale: vi })
    }
  }, [currentProgress.nextSession, targetProgress.nextSession])

  if (currentClassSessions.length === 0 || targetClassSessions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Không có thông tin tiến độ
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Lớp hiện tại */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Lớp cũ: {currentClassCode}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            Buổi {currentProgress.completed}/{currentProgress.total}
            {currentProgress.nextSession && (
              <span className="ml-1">
                ({format(parseISO(currentProgress.nextSession.date), 'dd/MM', { locale: vi })})
              </span>
            )}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${currentProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Gap indicator */}
      {dateGap && dateGap.direction !== 'same' && (
        <div className="flex items-center gap-2 pl-4">
          <ArrowDown className={cn(
            "h-3.5 w-3.5 shrink-0",
            dateGap.direction === 'later' ? "text-amber-600" : "text-blue-600"
          )} />
          <span className={cn(
            "text-xs",
            dateGap.direction === 'later' ? "text-amber-700" : "text-blue-700"
          )}>
            {dateGap.direction === 'later' ? (
              <>
                Gap {dateGap.days} ngày - Học viên sẽ nghỉ từ {dateGap.currentDate} đến {dateGap.targetDate}
              </>
            ) : (
              <>
                Lớp mới bắt đầu sớm hơn {dateGap.days} ngày ({dateGap.targetDate} so với {dateGap.currentDate})
              </>
            )}
          </span>
        </div>
      )}

      {dateGap && dateGap.direction === 'same' && (
        <div className="flex items-center gap-2 pl-4">
          <ArrowDown className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="text-xs text-emerald-700">
            Lịch học liên tục - Không có gap
          </span>
        </div>
      )}

      {/* Lớp mục tiêu */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Lớp mới: {targetClassCode}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            Buổi {targetProgress.completed}/{targetProgress.total}
            {targetProgress.nextSession && (
              <span className="ml-1">
                ({format(parseISO(targetProgress.nextSession.date), 'dd/MM', { locale: vi })}) ← Bắt đầu ở đây
              </span>
            )}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${targetProgress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
