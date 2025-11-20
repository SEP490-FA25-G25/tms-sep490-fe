import type { CourseProgress } from '@/store/services/courseApi'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    if (percentage >= 80) return 'text-success'
    if (percentage >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Tiến độ học tập</h2>
        <p className="text-muted-foreground">
          Theo dõi tiến độ học tập và hiệu quả của bạn
        </p>
      </div>

      {/* Main Progress Overview - Clean grid without cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Tiến độ tổng thể</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">
              {completionPercentage}%
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress.completedSessions}/{progress.totalSessions} buổi học
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold">Tỷ lệ điểm danh</h3>
          </div>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getStatusColor(attendanceRate)}`}>
              {attendanceRate}%
            </div>
            <Progress value={progress.attendanceRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress.completedSessions} buổi đã tham dự
            </p>
          </div>
        </div>

        {/* Current Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold">Trạng thái</h3>
          </div>
          <div className="space-y-3">
            <Badge variant={getStatusBadge(completionPercentage)}>
              {completionPercentage >= 80 ? 'Đang tiến bộ tốt' :
                completionPercentage >= 60 ? 'Đang tiến bộ' : 'Cần cố gắng'}
            </Badge>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                <span className="font-medium">Giai đoạn:</span> {progress.currentPhase}
              </p>
              {progress.nextSession && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Tiếp theo:</span> {progress.nextSession}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Detailed Progress Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CLO Progress */}
        {progress.cloProgress && progress.cloProgress.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Tiến độ CLO</h3>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {cloProgress.isAchieved ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <Clock className="h-3 w-3 text-warning" />
                    )}
                    <span>
                      {cloProgress.completedAssessments}/{cloProgress.totalAssessments} bài kiểm tra
                    </span>
                    <span>• Điểm TB: {cloProgress.averageScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Progress */}
        {progress.assessmentProgress && progress.assessmentProgress.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Tiến độ đánh giá</h3>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{assessment.assessmentType}</span>
                    <span>• Trọng số: {assessment.weight}%</span>
                    <span>• Điểm: {assessment.achievedScore}/{assessment.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Completion Timeline */}
      {progress.estimatedCompletionDate && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold">Dự kiến hoàn thành</h3>
            <div className="text-center space-y-2 p-6 bg-muted/30 rounded-lg border">
              <div className="text-2xl font-bold">
                {new Date(progress.estimatedCompletionDate).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <p className="text-muted-foreground">
                Dựa trên tiến độ hiện tại và lịch học dự kiến
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}