import type { CourseProgress } from '@/store/services/courseApi'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  BookOpen
} from 'lucide-react'

interface ProgressDashboardProps {
  progress: CourseProgress
}

export function ProgressDashboard({ progress }: ProgressDashboardProps) {
  const completionPercentage = Math.round(progress.progressPercentage)
  const attendanceRate = Math.round(progress.attendanceRate)

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Tiến độ học tập</h2>
      </div>

      {/* Main Progress Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold">Tiến độ tổng thể</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {completionPercentage}%
              </div>
              <Progress value={progress.progressPercentage} className="h-2" />
              <p className="text-sm text-gray-600">
                {progress.completedSessions}/{progress.totalSessions} buổi học
              </p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="lg:border-l lg:pl-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold">Tỷ lệ điểm danh</h3>
            </div>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getStatusColor(attendanceRate)}`}>
                {attendanceRate}%
              </div>
              <Progress value={progress.attendanceRate} className="h-2" />
              <p className="text-sm text-gray-600">
                {progress.completedSessions} buổi đã tham dự
              </p>
            </div>
          </div>

          {/* Materials Progress */}
          <div className="md:border-l md:pl-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold">Tiền độ tài liệu</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {progress.accessibleMaterials}
              </div>
              <div className="text-lg text-gray-600">
                /{progress.totalMaterials} tài liệu
              </div>
              <p className="text-sm text-gray-600">
                {Math.round((progress.accessibleMaterials / progress.totalMaterials) * 100)}% khả dụng
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="lg:border-l lg:pl-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h3 className="font-semibold">Trạng thái</h3>
            </div>
            <div className="space-y-3">
              <Badge variant={getStatusBadge(completionPercentage)}>
                {completionPercentage >= 80 ? 'Đang tiến bộ tốt' :
                 completionPercentage >= 60 ? 'Đang tiến bộ' : 'Cần cố gắng'}
              </Badge>
              <div className="text-sm space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Giai đoạn:</span> {progress.currentPhase}
                </p>
                {progress.nextSession && (
                  <p className="text-gray-600">
                    <span className="font-medium">Tiếp theo:</span> {progress.nextSession}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Progress Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLO Progress */}
        {progress.cloProgress && progress.cloProgress.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Tiến độ CLO</h3>
              <div className="space-y-4">
                {progress.cloProgress.map((cloProgress) => (
                  <div key={cloProgress.cloId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cloProgress.cloCode}</span>
                      <span className="text-sm">
                        {Math.round(cloProgress.achievementRate)}%
                      </span>
                    </div>
                    <Progress value={cloProgress.achievementRate} className="h-1" />
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {cloProgress.isAchieved ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Clock className="h-3 w-3 text-orange-600" />
                      )}
                      <span>
                        {cloProgress.completedAssessments}/{cloProgress.totalAssessments} bài tập
                      </span>
                      <span>• Điểm TB: {cloProgress.averageScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Progress */}
        {progress.assessmentProgress && progress.assessmentProgress.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Tiến độ đánh giá</h3>
              <div className="space-y-4">
                {progress.assessmentProgress.map((assessment) => (
                  <div key={assessment.assessmentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {assessment.name}
                      </span>
                      <span className="text-sm whitespace-nowrap">
                        {assessment.isCompleted ? `${assessment.percentageScore.toFixed(1)}%` : 'Chưa làm'}
                      </span>
                    </div>
                    {assessment.isCompleted && (
                      <Progress value={assessment.percentageScore} className="h-1" />
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{assessment.assessmentType}</span>
                      <span>• Trọng số: {assessment.weight}%</span>
                      <span>• Điểm: {assessment.achievedScore}/{assessment.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Timeline */}
      {progress.estimatedCompletionDate && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Dự kiến hoàn thành</h3>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {new Date(progress.estimatedCompletionDate).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <p className="text-gray-600">
                Dựa trên tiến độ hiện tại và lịch học dự kiến
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}