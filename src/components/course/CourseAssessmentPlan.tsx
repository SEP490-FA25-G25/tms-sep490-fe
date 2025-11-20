import type { CourseAssessment } from '@/store/services/courseApi'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Clock,
  Target,
  Calendar,
  BookOpen
} from 'lucide-react'

interface CourseAssessmentPlanProps {
  assessments: CourseAssessment[]
}

export function CourseAssessmentPlan({ assessments }: CourseAssessmentPlanProps) {
  const getAssessmentTypeLabel = (assessmentType: string) => {
    switch (assessmentType.toUpperCase()) {
      case 'QUIZ':
        return 'Bài kiểm tra'
      case 'MIDTERM':
        return 'Giữa kỳ'
      case 'FINAL':
        return 'Cuối kỳ'
      case 'ASSIGNMENT':
        return 'Bài tập'
      case 'PROJECT':
        return 'Đồ án'
      case 'ORAL':
        return 'Thuyết trình'
      case 'PRACTICE':
        return 'Thực hành'
      case 'OTHER':
        return 'Khác'
      default:
        return assessmentType
    }
  }

  const getAssessmentTypeVariant = (assessmentType: string) => {
    switch (assessmentType.toUpperCase()) {
      case 'QUIZ':
        return 'secondary'
      case 'MIDTERM':
        return 'default'
      case 'FINAL':
        return 'destructive'
      case 'ASSIGNMENT':
        return 'outline'
      case 'PROJECT':
        return 'secondary'
      case 'ORAL':
        return 'outline'
      case 'PRACTICE':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getTotalWeight = () => {
    return assessments.reduce((sum, assessment) => sum + (assessment.weight || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{assessments.length}</div>
            <div className="text-sm text-muted-foreground">Hình thức đánh giá</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{getTotalWeight()}%</div>
            <div className="text-sm text-muted-foreground">Tổng trọng số</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {assessments.filter(a => a.duration).length}
            </div>
            <div className="text-sm text-muted-foreground">Có thời lượng</div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.map((assessment, index) => (
          <Card key={assessment.id} className="overflow-hidden">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <Badge variant={getAssessmentTypeVariant(assessment.assessmentType)}>
                      {getAssessmentTypeLabel(assessment.assessmentType)}
                    </Badge>
                    {assessment.weight && (
                      <span className="text-sm font-semibold text-primary">
                        {assessment.weight}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{assessment.name}</h3>
                  {assessment.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {assessment.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {assessment.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Thời lượng:</span>
                    <span className="text-muted-foreground">{assessment.duration}</span>
                  </div>
                )}

                {assessment.maxScore && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Điểm tối đa:</span>
                    <span className="text-muted-foreground">{assessment.maxScore}</span>
                  </div>
                )}

                {assessment.sessionIds && assessment.sessionIds.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Buổi học:</span>
                    <span className="text-muted-foreground">
                      {assessment.sessionIds.length} buổi
                    </span>
                  </div>
                )}

                {assessment.cloMappings && assessment.cloMappings.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">CLO:</span>
                    <span className="text-muted-foreground">
                      {assessment.cloMappings.length} mục tiêu
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}