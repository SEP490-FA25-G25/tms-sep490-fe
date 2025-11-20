import type { CourseCLO, CLOProgress } from '@/store/services/courseApi'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Target, CheckCircle, Clock, Check } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

  // Extract unique PLOs for columns
  const allPLOs = clos.flatMap(clo => clo.relatedPLOs || [])
  const uniquePLOs = Array.from(new Set(allPLOs.map(plo => plo.id)))
    .map(id => allPLOs.find(plo => plo.id === id)!)
    .sort((a, b) => a.code.localeCompare(b.code))

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Kết quả học tập</h2>
        <p className="text-muted-foreground">
          {clos.length} CLOs • {completedCLOs} đã đạt • {Math.round(overallProgress)}% hoàn thành
        </p>
      </div>

      {/* Overall Progress - Clean layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Tiến độ tổng thể</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(overallProgress)}%
            </div>
            <p className="text-sm text-muted-foreground">hoàn thành</p>
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{completedCLOs} CLOs đã đạt</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span>{clos.length - completedCLOs} CLOs đang học</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* CLO - PLO Matrix Table - Clean without card wrapper */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ma trận CLO-PLO</h3>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px] min-w-[300px] bg-muted/50">CLO (Chuẩn đầu ra môn học)</TableHead>
                <TableHead className="w-[120px] bg-muted/50">Trạng thái</TableHead>
                <TableHead className="w-[100px] bg-muted/50">Tiến độ</TableHead>
                {uniquePLOs.map(plo => (
                  <TableHead key={plo.id} className="text-center min-w-[80px] bg-muted/50">
                    <div className="flex flex-col items-center justify-center" title={plo.description}>
                      <span>{plo.code}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clos.map((clo) => {
                const cloProgress = getProgressForCLO(clo.id)
                const relatedPloIds = new Set(clo.relatedPLOs?.map(p => p.id) || [])

                return (
                  <TableRow key={clo.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="font-bold text-blue-700">{clo.code}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2" title={clo.description}>
                          {clo.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cloProgress?.isAchieved ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          Đã đạt
                        </Badge>
                      ) : cloProgress ? (
                        <Badge variant="secondary">
                          Đang học
                        </Badge>
                      ) : (
                        <Badge variant="outline">Chưa học</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {cloProgress && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {Math.round(cloProgress.achievementRate)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    {uniquePLOs.map(plo => (
                      <TableCell key={plo.id} className="text-center">
                        {relatedPloIds.has(plo.id) && (
                          <div className="flex justify-center">
                            <Check className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}