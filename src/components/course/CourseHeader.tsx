import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CourseDetail, CourseProgress, MaterialHierarchy } from '@/store/services/courseApi'
import { BookOpen, Clock, Calendar } from 'lucide-react'

interface CourseHeaderProps {
  course: CourseDetail
  progress?: CourseProgress
  materials?: MaterialHierarchy
}

export function CourseHeader({ course, progress, materials }: CourseHeaderProps) {
  const progressPercentage = progress?.progressPercentage || 0
  const nextSession = progress?.nextSession || 'Chưa bắt đầu'

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
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  {course.name}
                </h1>
                <p className="text-xl text-gray-600">
                  {course.code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(course.approvalStatus)}>
                  {getStatusText(course.approvalStatus)}
                </Badge>
              </div>
            </div>

            {/* Course Metadata */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              {course.subjectName && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.subjectName}</span>
                </div>
              )}
              {course.levelName && (
                <div className="flex items-center gap-2">
                  <span>Level: {course.levelName}</span>
                </div>
              )}
              {course.totalHours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.totalHours} giờ</span>
                </div>
              )}
              {course.durationWeeks && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{course.durationWeeks} tuần</span>
                </div>
              )}
            </div>

            {/* Description */}
            {course.description && (
              <p className="text-gray-700 max-w-4xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Progress Section */}
          {(progress || progressPercentage > 0) && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tiến độ học tập</h3>
                  <p className="text-sm text-gray-600">
                    {progress?.completedSessions || 0}/{progress?.totalSessions || 0} buổi học
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(progressPercentage)}%
                  </div>
                  <p className="text-sm text-gray-600">hoàn thành</p>
                </div>
              </div>

              <Progress value={progressPercentage} className="h-3" />

              {/* Additional Progress Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {progress?.attendanceRate && (
                  <div>
                    <span className="text-gray-600">Điểm danh: </span>
                    <span className="font-medium">{progress.attendanceRate.toFixed(1)}%</span>
                  </div>
                )}
                {progress?.currentPhase && (
                  <div>
                    <span className="text-gray-600">Giai đoạn hiện tại: </span>
                    <span className="font-medium">{progress.currentPhase}</span>
                  </div>
                )}
                {nextSession && (
                  <div>
                    <span className="text-gray-600">Buổi học tiếp theo: </span>
                    <span className="font-medium">{nextSession}</span>
                  </div>
                )}
                {materials && (
                  <div>
                    <span className="text-gray-600">Tài liệu: </span>
                    <span className="font-medium">
                      {materials.accessibleMaterials}/{materials.totalMaterials} có sẵn
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BookOpen className="h-4 w-4 mr-2" />
              Xem buổi học tiếp theo
            </Button>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Tải tài liệu
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Xem lịch học
            </Button>
          </div>
        </div>

        {/* Visual Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </div>
  )
}