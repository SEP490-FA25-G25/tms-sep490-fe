import type { CourseProgress } from '@/store/services/courseApi'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react'

interface ProgressDashboardProps {
  progress: CourseProgress
}

export function ProgressDashboard({ progress }: ProgressDashboardProps) {
  const completionPercentage = Math.round(progress.progressPercentage)

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'destructive'
  }

  const getAssessmentTypeLabel = (assessmentType: string) => {
    switch (assessmentType?.toUpperCase()) {
      case 'QUIZ':
        return 'Quiz'
      case 'MIDTERM':
        return 'Giữa kỳ'
      case 'FINAL':
        return 'Cuối kỳ'
      case 'ASSIGNMENT':
        return 'Bài tập'
      case 'PROJECT':
        return 'Dự án'
      case 'ORAL':
        return 'Thuyết trình'
      case 'PRACTICE':
        return 'Thực hành'
      default:
        return assessmentType
    }
  }

  return (
    <div className="space-y-8" id="tien-do-hoc-tap">
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
            <div className="rounded-lg border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Bài đánh giá</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Loại</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Điểm</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Trạng thái</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.assessmentProgress.map((assessment) => (
                    <tr key={assessment.assessmentId} className="border-t">
                      <td className="px-4 py-2 font-medium">{assessment.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {getAssessmentTypeLabel(assessment.assessmentType)}
                      </td>
                      <td className="px-4 py-2">
                        {assessment.isCompleted
                          ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground">
                                {assessment.achievedScore}/{assessment.maxScore}
                              </div>
                            </div>
                          )
                          : <span className="text-muted-foreground">Chưa làm</span>}
                      </td>
                      <td className="px-4 py-2">
                        {assessment.isCompleted ? (
                          <Badge variant="secondary">Đã làm</Badge>
                        ) : (
                          <Badge variant="outline">Chưa làm</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {assessment.completedAt
                          ? new Date(assessment.completedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
