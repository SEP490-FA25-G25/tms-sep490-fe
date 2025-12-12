import type { CourseAssessment, AssessmentProgress } from '@/store/services/courseApi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface AssessmentTrackerProps {
  assessments: CourseAssessment[]
  assessmentProgress?: AssessmentProgress[]
}

export function AssessmentTracker({ assessments, assessmentProgress }: AssessmentTrackerProps) {
  const getProgressForAssessment = (assessmentId: number) => {
    return assessmentProgress?.find(p => p.assessmentId === assessmentId)
  }

  const getOverallScore = () => {
    if (!assessmentProgress || assessmentProgress.length === 0) return null
    const completed = assessmentProgress.filter(p => p.isCompleted)
    if (completed.length === 0) return null
    const average = completed.reduce((sum, p) => sum + p.percentageScore, 0) / completed.length
    return average
  }

  const completedAssessments = assessmentProgress?.filter(p => p.isCompleted).length || 0
  const overallScore = getOverallScore()

  const getStatusIcon = (isCompleted?: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-4 w-4 text-emerald-600" />
    }
    return <Clock className="h-4 w-4 text-amber-600" />
  }

  const getStatusBadge = (isCompleted?: boolean) => {
    if (isCompleted) {
      return <Badge variant="success">Đã nộp</Badge>
    }
    return <Badge variant="outline">Chưa nộp</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bài tập & Đánh giá</h2>
        <p className="text-gray-600">
          {assessments.length} bài tập • {completedAssessments} đã hoàn thành
        </p>
      </div>

      {/* Overall Summary */}
      {overallScore !== null && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Điểm trung bình</h3>
              </div>
              <div className="text-4xl font-bold text-blue-600">
                {overallScore.toFixed(1)}%
              </div>
              <Progress value={overallScore} className="h-3 max-w-md mx-auto" />
              <p className="text-sm text-gray-600">
                Trung bình các bài đã làm ({completedAssessments}/{assessments.length})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Assessments */}
      <div className="space-y-4">
        {assessments.map((assessment) => {
          const progress = getProgressForAssessment(assessment.id)

          return (
            <Card key={assessment.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Assessment Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{assessment.name}</h3>
                        {getStatusBadge(progress?.isCompleted)}
                      </div>
                      {assessment.description && (
                        <p className="text-gray-600">{assessment.description}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        {getStatusIcon(progress?.isCompleted)}
                        <span className="text-sm font-medium text-muted-foreground">
                          {assessment.assessmentType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Điểm tối đa: {assessment.maxScore}
                      </p>
                    </div>
                  </div>

                  {/* Progress Details */}
                  {progress && (
                    <div className="pl-8 border-l-2 border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Điểm đạt được:</span>
                        <div className="text-right">
                          <div className="font-semibold">
                            {progress.achievedScore}/{assessment.maxScore}
                          </div>
                          <div className="text-sm text-gray-600">
                            {progress.percentageScore.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {progress.completedAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Nộp bài: {new Date(progress.completedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assessment Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{assessment.assessmentType}</span>
                    </div>
                    {assessment.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Thời gian: {assessment.duration}</span>
                      </div>
                    )}
                    {assessment.cloMappings && assessment.cloMappings.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>CLOs: {assessment.cloMappings.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Button>
                    {progress?.isCompleted ? (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Xem kết quả
                      </Button>
                    ) : (
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Bắt đầu làm bài
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {assessments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bài tập nào</h3>
            <p className="text-gray-600">
              Hiện tại chưa có bài tập hoặc đánh giá nào cho môn học này.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
