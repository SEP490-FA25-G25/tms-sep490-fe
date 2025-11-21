import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import type { AssessmentDTO, StudentAssessmentScoreDTO } from '@/types/studentClass';
import { ASSESSMENT_KINDS } from '@/types/studentClass';
import { cn } from '@/lib/utils';

interface ScoresTabProps {
  scores: StudentAssessmentScoreDTO[];
  isLoading: boolean;
  assessments: AssessmentDTO[];
}

const ScoresTab: React.FC<ScoresTabProps> = ({ scores, isLoading, assessments }) => {
  const assessmentMap = useMemo(
    () => new Map(assessments.map((assessment) => [assessment.id, assessment])),
    [assessments]
  );

  const gradedScores = useMemo(
    () => scores.filter((score) => score.isGraded && score.score !== null),
    [scores]
  );

  const averageScore = gradedScores.length > 0
    ? gradedScores.reduce((sum, score) => sum + (score.score || 0), 0) / gradedScores.length
    : 0;

  const highestScore = gradedScores.length > 0
    ? Math.max(...gradedScores.map(score => score.score || 0))
    : 0;

  const lowestScore = gradedScores.length > 0
    ? Math.min(...gradedScores.map(score => score.score || 0))
    : 0;

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Điểm số</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bảng điểm</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            TB: {averageScore > 0 ? averageScore.toFixed(1) : 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            Thấp nhất: {lowestScore > 0 ? lowestScore.toFixed(1) : 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Cao nhất: {highestScore > 0 ? highestScore.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết điểm số</CardTitle>
        </CardHeader>
        <CardContent>
          {gradedScores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài kiểm tra</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Ngày chấm</TableHead>
                    <TableHead>Người chấm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradedScores
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((score) => {
                      const assessment = assessmentMap.get(score.assessmentId);
                      const maxScore = assessment?.maxScore || 10;
                      const scorePercentage = score.score != null ? ((score.score as number) / maxScore) * 100 : 0;

                      return (
                        <TableRow key={score.assessmentId}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">
                                {assessment?.name || 'Bài kiểm tra'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Mã: {assessment?.id ?? score.assessmentId}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {assessment ? ASSESSMENT_KINDS[assessment.kind] : 'Khác'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className={cn("text-sm font-semibold", getScoreColor(score.score || 0, maxScore))}>
                                {score.score}/{maxScore}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {scorePercentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {score.gradedAt ? formatDate(score.gradedAt) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {score.gradedBy || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <BarChart3 className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              Chưa có điểm số nào.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoresTab;
