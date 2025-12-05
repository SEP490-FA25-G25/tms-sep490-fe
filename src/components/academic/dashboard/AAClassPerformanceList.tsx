import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, ChevronRight, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ClassPerformanceItem {
  classId: number
  classCode: string
  className: string
  courseName: string
  attendanceRate: number
  homeworkCompletionRate: number
  totalSessions: number
  completedSessions: number
}

interface AAClassPerformanceListProps {
  classes: ClassPerformanceItem[]
  isLoading?: boolean
  onViewAll?: () => void
  onViewClass?: (classId: number) => void
}

function getPerformanceLevel(rate: number): 'critical' | 'warning' | 'normal' {
  if (rate < 70) return 'critical'
  if (rate < 85) return 'warning'
  return 'normal'
}

function PerformanceBar({ label, value, showWarning }: { label: string; value: number; showWarning?: boolean }) {
  const level = getPerformanceLevel(value)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          level === 'critical' && "text-red-600 dark:text-red-400",
          level === 'warning' && "text-amber-600 dark:text-amber-400",
          level === 'normal' && "text-green-600 dark:text-green-400"
        )}>
          {value.toFixed(1)}%
          {showWarning && level !== 'normal' && (
            <TrendingDown className="inline-block ml-1 h-3 w-3" />
          )}
        </span>
      </div>
      <Progress 
        value={value} 
        className={cn(
          "h-1.5",
          level === 'critical' && "[&>div]:bg-red-500",
          level === 'warning' && "[&>div]:bg-amber-500",
          level === 'normal' && "[&>div]:bg-green-500"
        )}
      />
    </div>
  )
}

export function AAClassPerformanceList({ 
  classes, 
  isLoading, 
  onViewAll, 
  onViewClass 
}: AAClassPerformanceListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter classes with low performance (attendance < 85% OR homework < 85%)
  const lowPerformanceClasses = classes.filter(
    c => c.attendanceRate < 85 || c.homeworkCompletionRate < 85
  ).sort((a, b) => {
    // Sort by lowest rate first
    const aMin = Math.min(a.attendanceRate, a.homeworkCompletionRate)
    const bMin = Math.min(b.attendanceRate, b.homeworkCompletionRate)
    return aMin - bMin
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Lớp cần chú ý
          </CardTitle>
          <CardDescription>
            {lowPerformanceClasses.length} lớp có tỉ lệ thấp
          </CardDescription>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-sm"
            onClick={onViewAll}
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {lowPerformanceClasses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
            <p className="font-medium text-foreground">Tất cả lớp đang hoạt động tốt!</p>
            <p className="text-sm">Không có lớp nào có tỉ lệ điểm danh hoặc bài tập dưới 85%</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {lowPerformanceClasses.map((classItem) => {
                const attendanceLevel = getPerformanceLevel(classItem.attendanceRate)
                const homeworkLevel = getPerformanceLevel(classItem.homeworkCompletionRate)
                const hasCritical = attendanceLevel === 'critical' || homeworkLevel === 'critical'
                
                return (
                  <div
                    key={classItem.classId}
                    className={cn(
                      "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      hasCritical && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                    )}
                    onClick={() => onViewClass?.(classItem.classId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-foreground">
                            {classItem.classCode}
                          </span>
                          {hasCritical && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Cần xử lý
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {classItem.courseName}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {classItem.completedSessions}/{classItem.totalSessions} buổi
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <PerformanceBar 
                        label="Điểm danh" 
                        value={classItem.attendanceRate} 
                        showWarning
                      />
                      <PerformanceBar 
                        label="Bài tập" 
                        value={classItem.homeworkCompletionRate}
                        showWarning
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
