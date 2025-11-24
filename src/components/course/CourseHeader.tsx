import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CourseDetail, CourseProgress, MaterialHierarchy } from '@/store/services/courseApi'
import { BookOpen, Clock, Calendar, Users, Target } from 'lucide-react'

interface CourseHeaderProps {
  course: CourseDetail
  progress?: CourseProgress
  materials?: MaterialHierarchy
}

export function CourseHeader({ course, progress, materials }: CourseHeaderProps) {
  // Use course progress if available, fallback to detailed progress
  const progressPercentage = course.progressPercentage || progress?.progressPercentage || 0
  const nextSession = progress?.nextSession || 'Chưa bắt đầu'

  // Use course session data if detailed progress is not available
  const completedSessions = course.completedSessions || progress?.completedSessions || 0
  const totalSessions = course.totalSessions || progress?.totalSessions || 0

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt'
      case 'PENDING':
        return 'Chờ duyệt'
      case 'REJECTED':
        return 'Bị từ chối'
      default:
        return status
    }
  }

  return (
    <div className="border-b bg-white">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 lg:px-6 max-w-7xl mx-auto space-y-8">
          {/* Title + CTAs */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={getStatusBadgeVariant(course.approvalStatus)}>
                  {getStatusText(course.approvalStatus)}
                </Badge>
                {course.levelName && (
                  <Badge variant="secondary">
                    Cấp độ: {course.levelName}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {course.name}
                </h1>
                <p className="text-lg text-muted-foreground">{course.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {course.subjectName && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.subjectName}</span>
                  </div>
                )}
              </div>
              {course.description && (
                <p className="text-muted-foreground max-w-4xl leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start lg:items-end gap-3">
              <div className="space-y-1 text-left lg:text-right">
                <div className="text-sm text-muted-foreground">Tóm tắt tiến độ</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
                  <div className="text-sm text-muted-foreground">
                    {completedSessions}/{totalSessions} buổi
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tiếp theo: <span className="text-foreground">{nextSession}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Vào học ngay
                </Button>
                {materials && (
                  <Button variant="ghost">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tải tài liệu
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {course.totalHours && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Tổng thời gian</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{course.totalHours} giờ</p>
              </div>
            )}

            {course.durationWeeks && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Thời gian</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{course.durationWeeks} tuần</p>
              </div>
            )}

            {course.totalSessions && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Buổi học</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{course.totalSessions} buổi</p>
              </div>
            )}

            {course.sessionPerWeek && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Lịch học</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{course.sessionPerWeek} buổi/tuần</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
