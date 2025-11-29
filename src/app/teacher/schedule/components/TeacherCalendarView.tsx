import { useMemo, useState, useEffect } from 'react'
import { format, addDays, parseISO, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  type DayOfWeek,
  type TeacherSessionSummaryDTO,
  type TeacherWeeklyScheduleData,
} from '@/store/services/teacherScheduleApi'
import { Badge } from '@/components/ui/badge'

interface TeacherCalendarViewProps {
  scheduleData: TeacherWeeklyScheduleData
  onSessionClick: (sessionId: number) => void
  className?: string
}

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'CN',
}

// Colors for different session statuses or types
const SESSION_VARIANTS: Record<string, { bg: string; border: string; text: string }> = {
  PLANNED: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  DONE: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  CANCELLED: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  // Fallback
  DEFAULT: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
}

const DEFAULT_START_HOUR = 7
const DEFAULT_END_HOUR = 22
const HOUR_HEIGHT = 60 // px per hour

const parseTimeToMinutes = (timeStr?: string) => {
  if (!timeStr) return NaN
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

export function TeacherCalendarView({ scheduleData, onSessionClick, className }: TeacherCalendarViewProps) {
  const startDate = useMemo(() => parseISO(scheduleData.weekStart), [scheduleData.weekStart])
  
  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const { startHour, endHour } = useMemo(() => {
    const starts = (scheduleData.timeSlots || [])
      .map((slot) => parseTimeToMinutes(slot.startTime))
      .filter((v) => Number.isFinite(v))
    const ends = (scheduleData.timeSlots || [])
      .map((slot) => parseTimeToMinutes(slot.endTime))
      .filter((v) => Number.isFinite(v))

    if (!starts.length || !ends.length) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR }
    }

    const minStart = Math.min(...starts)
    const maxEnd = Math.max(...ends)
    return {
      startHour: Math.max(0, Math.floor(minStart / 60)),
      endHour: Math.min(23, Math.ceil(maxEnd / 60)),
    }
  }, [scheduleData.timeSlots])

  const hours = useMemo(() => {
    const range: number[] = []
    for (let i = startHour; i <= endHour; i++) {
      range.push(i)
    }
    return range
  }, [startHour, endHour])

  const getEventStyle = (session: TeacherSessionSummaryDTO) => {
    const startMinutes = parseTimeToMinutes(session.startTime)
    const endMinutes = parseTimeToMinutes(session.endTime)

    const startOffset = (Number.isFinite(startMinutes) ? startMinutes : startHour * 60) - startHour * 60
    const duration = Number.isFinite(startMinutes) && Number.isFinite(endMinutes)
      ? endMinutes - startMinutes
      : 60

    const top = Math.max(0, (startOffset / 60) * HOUR_HEIGHT)
    const height = Math.max(HOUR_HEIGHT / 2, (duration / 60) * HOUR_HEIGHT)

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  // Calculate current time indicator position
  const currentTimeIndicator = useMemo(() => {
    const now = currentTime
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const totalMinutes = currentHour * 60 + currentMinute
    
    // Check if current time is within the displayed range
    if (currentHour < startHour || currentHour > endHour) {
      return null
    }
    
    // Find which day column is today
    const todayIndex = DAYS.findIndex((_, index) => {
      const date = addDays(startDate, index)
      return isToday(date)
    })
    
    if (todayIndex === -1) {
      return null // Today is not in current week view
    }
    
    const offsetFromStart = totalMinutes - startHour * 60
    const topPosition = (offsetFromStart / 60) * HOUR_HEIGHT
    const timeLabel = format(now, 'H:mm')
    
    return {
      top: topPosition,
      dayIndex: todayIndex,
      timeLabel,
    }
  }, [currentTime, startHour, endHour, startDate])

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm", className)}>
      {/* Calendar Header (Days) */}
      <div className="grid grid-cols-8 border-b divide-x">
        <div className="p-4 text-center text-xs font-medium text-muted-foreground">
          GIỜ
        </div>
        {DAYS.map((day, index) => {
          const date = addDays(startDate, index)
          const isTodayDate = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          
          return (
            <div key={day} className={cn("flex flex-col items-center justify-center p-3", isTodayDate && "bg-muted/30")}>
              <span className={cn("text-xs font-medium uppercase", isTodayDate ? "text-primary" : "text-muted-foreground")}>
                {DAY_LABELS[day]}
              </span>
              <div className={cn(
                "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                isTodayDate ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Calendar Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="relative grid grid-cols-8 divide-x" style={{ height: `${(endHour - startHour + 1) * HOUR_HEIGHT}px` }}>
          
          {/* Time Column */}
          <div className="relative border-r bg-muted/5">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-b border-dashed border-border/50 text-right pr-2 text-xs text-muted-foreground"
                style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-translate-y-1/2 block pt-2">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
            {/* Current time label in time column */}
            {currentTimeIndicator && (
              <div 
                className="absolute right-0 z-50 flex items-center"
                style={{ top: `${currentTimeIndicator.top}px`, transform: 'translateY(-50%)' }}
              >
                <span className="bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded mr-1">
                  {currentTimeIndicator.timeLabel}
                </span>
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
            )}
          </div>

          {/* Days Columns */}
          {DAYS.map((day) => (
            <div key={day} className="relative">
              {/* Grid lines for hours */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full border-b border-border/30"
                  style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                />
              ))}

              {/* Current time indicator line */}
              {currentTimeIndicator && (
                <div 
                  className="absolute left-0 right-0 z-50 pointer-events-none"
                  style={{ top: `${currentTimeIndicator.top}px` }}
                >
                  <div 
                    className="w-full border-t-2 border-dotted border-primary/60"
                  />
                </div>
              )}

              {/* Events */}
              {scheduleData.schedule[day]?.map((session) => {
                const variant = SESSION_VARIANTS[session.sessionStatus] || SESSION_VARIANTS.DEFAULT
                
                return (
                  <button
                    key={session.sessionId}
                    onClick={() => onSessionClick(session.sessionId)}
                    className={cn(
                      "absolute inset-x-1 rounded-md border p-2 text-left text-xs transition-all hover:brightness-95 hover:z-10 focus:ring-2 focus:ring-primary focus:outline-none",
                      variant.bg,
                      variant.border,
                      variant.text
                    )}
                    style={getEventStyle(session)}
                  >
                    <div className="font-semibold truncate">{session.courseName}</div>
                    <div className="truncate opacity-90">{session.classCode}</div>
                    <div className="mt-1 flex items-center gap-1 truncate opacity-75">
                      <span>{session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}</span>
                    </div>
                    {session.isMakeup && (
                       <Badge variant="secondary" className="mt-1 h-4 px-1 text-[10px]">Buổi bù</Badge>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

