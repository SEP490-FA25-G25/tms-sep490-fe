import { Progress } from '@/components/ui/progress'
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
        {/* Course Title Section */}
        <div className="px-4 lg:px-6 space-y-6">
          <div className="space-y-4">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {course.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {course.code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(course.approvalStatus)}>
                  {getStatusText(course.approvalStatus)}
                </Badge>
              </div>
            </div>

            {/* Course Metadata - Simplified */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              {course.subjectName && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.subjectName}</span>
                </div>
              )}
              {course.levelName && (
                <div className="flex items-center gap-2">
                  <span>Cấp độ: {course.levelName}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {course.description && (
              <p className="text-muted-foreground max-w-4xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Key Information Grid */}
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {course.totalHours && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Tổng thời gian</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{course.totalHours} giờ</p>
                </div>
              )}

              {course.durationWeeks && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Thời gian</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{course.durationWeeks} tuần</p>
                </div>
              )}

              {course.totalSessions && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Buổi học</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{course.totalSessions} buổi</p>
                </div>
              )}

              {course.sessionPerWeek && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Lịch học</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{course.sessionPerWeek} buổi/tuần</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Simplified */}
          <div className="px-4 lg:px-6 flex flex-wrap gap-3">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Vào học ngay
            </Button>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Tải tài liệu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}