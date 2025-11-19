import type { CourseCLO, CLOProgress } from '@/store/services/courseApi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, CheckCircle, Clock } from 'lucide-react'

interface LearningOutcomesProps {
  clos: CourseCLO[]
  progress?: CLOProgress[]
}

export function LearningOutcomes({ clos, progress }: LearningOutcomesProps) {
  const getProgressForCLO = (cloId: number) => {
    return progress?.find(p => p.cloId === cloId)
  }

  const getOverallProgress = () => {
    if (!progress || progress.length === 0) return 0
    const totalProgress = progress.reduce((sum, p) => sum + p.achievementRate, 0)
    return totalProgress / progress.length
  }

  const overallProgress = getOverallProgress()
  const completedCLOs = progress?.filter(p => p.isAchieved).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Kết quả học tập</h2>
        <p className="text-gray-600">
          {clos.length} CLOs • {completedCLOs} đã đạt • {Math.round(overallProgress)}% hoàn thành
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Tiến độ tổng thể</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(overallProgress)}%
              </div>
              <p className="text-sm text-gray-600">hoàn thành</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{completedCLOs} CLOs đã đạt</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>{clos.length - completedCLOs} CLOs đang học</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual CLOs */}
      <div className="grid gap-4">
        {clos.map((clo) => {
          const cloProgress = getProgressForCLO(clo.id)

          return (
            <Card key={clo.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{clo.code}</h3>
                        {cloProgress?.isAchieved ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã đạt
                          </Badge>
                        ) : cloProgress ? (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Đang học
                          </Badge>
                        ) : (
                          <Badge variant="outline">Chưa bắt đầu</Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{clo.description}</p>
                      {clo.competencyLevel && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Cấp độ:</span> {clo.competencyLevel}
                        </p>
                      )}
                    </div>
                  </div>

                  {cloProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tiến độ</span>
                        <span className="font-medium">
                          {Math.round(cloProgress.achievementRate)}%
                        </span>
                      </div>
                      <Progress value={cloProgress.achievementRate} className="h-2" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Bài tập:</span>
                          <p className="font-medium">
                            {cloProgress.completedAssessments}/{cloProgress.totalAssessments}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Điểm trung bình:</span>
                          <p className="font-medium">{cloProgress.averageScore.toFixed(1)}/100</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Trạng thái:</span>
                          <p className="font-medium">
                            {cloProgress.isAchieved ? 'Đã đạt' : 'Chưa đạt'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related PLOs */}
                  {clo.relatedPLOs && clo.relatedPLOs.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Liên quan PLO:</h4>
                      <div className="flex flex-wrap gap-2">
                        {clo.relatedPLOs.map((plo) => (
                          <Badge key={plo.id} variant="outline" className="text-xs">
                            {plo.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}