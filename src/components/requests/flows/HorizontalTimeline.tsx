import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionInfo } from '@/store/services/studentRequestApi'

interface HorizontalTimelineProps {
  currentClassSessions: SessionInfo[]
  targetClassSessions: SessionInfo[]
  currentClassCode: string
  targetClassCode: string
  selectedSessionId: number | null
  onSelectSession: (sessionId: number) => void
  currentSubjectId?: number
  targetSubjectId?: number
}

export default function HorizontalTimeline({
  currentClassSessions,
  targetClassSessions,
  currentClassCode,
  targetClassCode,
  selectedSessionId,
  onSelectSession,
  currentSubjectId,
  targetSubjectId
}: HorizontalTimelineProps) {
  const totalSessions = currentClassSessions.length
  const clampCenterIndex = (value: number) => {
    if (totalSessions === 0) return 0
    return Math.min(Math.max(value, 0), totalSessions - 1)
  }

  const [centerIndex, setCenterIndex] = useState(0)

  // Frontend computes upcoming session
  const upcomingSessionId = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcoming = currentClassSessions.find(
      (s) => s.status === 'PLANNED' && new Date(s.date) >= today
    )
    return upcoming?.sessionId
  }, [currentClassSessions])

  // Auto-center vào buổi tiếp theo (hoặc đầu danh sách nếu không có)
  useEffect(() => {
    if (totalSessions === 0) return

    const upcomingIndex = upcomingSessionId
      ? currentClassSessions.findIndex((s) => s.sessionId === upcomingSessionId)
      : -1

    setCenterIndex(clampCenterIndex(upcomingIndex !== -1 ? upcomingIndex : 0))
  }, [upcomingSessionId, currentClassSessions, totalSessions])

  // Giữ centerIndex trong biên khi dữ liệu thay đổi
  useEffect(() => {
    setCenterIndex((prev) => clampCenterIndex(prev))
  }, [totalSessions])

  const handlePrev = () => {
    setCenterIndex((prev) => clampCenterIndex(prev - 1))
  }

  const handleNext = () => {
    setCenterIndex((prev) => clampCenterIndex(prev + 1))
  }

  // Find aligned sessions by subjectSessionNumber
  const getAlignedTargetSession = (currentSession: SessionInfo): SessionInfo | null => {
    if (currentSubjectId && targetSubjectId && currentSubjectId !== targetSubjectId) {
      return null
    }

    return (
      targetClassSessions.find(
        (ts) => ts.subjectSessionNumber === currentSession.subjectSessionNumber
      ) || null
    )
  }

  const { visibleCurrentSessions, startIndex, endIndex } = useMemo(() => {
    if (totalSessions === 0) {
      return { visibleCurrentSessions: [] as SessionInfo[], startIndex: 0, endIndex: 0 }
    }

    const start = Math.max(0, Math.min(centerIndex - 2, Math.max(0, totalSessions - 5)))
    const end = Math.min(totalSessions, start + 5)

    return {
      visibleCurrentSessions: currentClassSessions.slice(start, end),
      startIndex: start,
      endIndex: end
    }
  }, [centerIndex, currentClassSessions, totalSessions])

  const hasPrev = startIndex > 0
  const hasNext = endIndex < totalSessions

  return (
    <div className="space-y-3">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Tiến độ học tập</div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            disabled={!hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative border rounded-lg p-4 bg-muted/20">
        {/* Current Class Row */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {currentClassCode}
            </Badge>
            <span className="text-xs text-muted-foreground">Lớp hiện tại</span>
          </div>
          
          <div
            className="flex gap-2 pb-2 justify-center"
          >
            {visibleCurrentSessions.map((session) => {
              // Frontend computes UI flags
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const sessionDate = new Date(session.date)
              sessionDate.setHours(0, 0, 0, 0)
              
              const isPast = sessionDate < today || session.status === 'DONE'
              const isUpcoming = session.sessionId === upcomingSessionId
              
              // Find last attended: last session with DONE status before today
              const lastAttendedSession = currentClassSessions
                .filter(s => s.status === 'DONE' && new Date(s.date) < today)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              const isLastAttended = session.sessionId === lastAttendedSession?.sessionId

              return (
                <div
                  key={session.sessionId}
                  className={cn(
                    'shrink-0 w-32 rounded-lg border p-2 transition-all',
                    isPast && 'bg-gray-50 border-gray-200 opacity-60',
                    isUpcoming && 'bg-blue-50 border-blue-300 ring-2 ring-blue-200',
                    !isPast && !isUpcoming && 'bg-background'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        Buổi {session.subjectSessionNumber}
                      </span>
                      {isLastAttended && (
                        <Badge variant="default" className="h-2 w-2 bg-emerald-500">
                          <Check className="h-2 w-2" />
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {session.subjectSessionTitle}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(session.date.toString()), 'dd/MM', { locale: vi })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vertical Alignment Indicator */}
        <div className="flex justify-center my-1">
          <div className="h-px w-full bg-border" />
        </div>

        {/* Target Class Row */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {targetClassCode}
            </Badge>
            <span className="text-xs text-muted-foreground">Lớp mục tiêu</span>
          </div>
          
          <div
            className="flex gap-2 pb-2 justify-center"
          >
            {visibleCurrentSessions.map((currentSession) => {
              const alignedSession = getAlignedTargetSession(currentSession)
              
              if (!alignedSession) {
                // Empty placeholder to maintain alignment
                return (
                  <div
                    key={`placeholder-${currentSession.sessionId}`}
                    className="shrink-0 w-32 rounded-lg border border-dashed border-gray-200 p-2 bg-gray-50/50"
                  >
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] text-gray-400">—</span>
                    </div>
                  </div>
                )
              }

              // Frontend computes isPast for target session
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const sessionDate = new Date(alignedSession.date)
              sessionDate.setHours(0, 0, 0, 0)
              
              const isPast = sessionDate < today || alignedSession.status === 'DONE'
              const isSelected = alignedSession.sessionId === selectedSessionId
              const canSelect = !isPast

              return (
                <button
                  key={alignedSession.sessionId}
                  onClick={() => canSelect && onSelectSession(alignedSession.sessionId)}
                  disabled={isPast}
                  className={cn(
                    'shrink-0 w-32 rounded-lg border p-2 transition-all text-left',
                    isPast && 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed',
                    !isPast && !isSelected && 'bg-background hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer',
                    isSelected && 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        Buổi {alignedSession.subjectSessionNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {alignedSession.subjectSessionTitle}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(alignedSession.date.toString()), 'dd/MM', { locale: vi })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Badge variant="default" className="h-2 w-2 bg-emerald-500">
                          <Check className="h-2 w-2" />
                        </Badge>
          <span>Đã học đến</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-blue-300 bg-blue-50" />
          <span>Buổi tiếp theo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-gray-200 bg-gray-50" />
          <span>Đã qua</span>
        </div>
      </div>
    </div>
  )
}
