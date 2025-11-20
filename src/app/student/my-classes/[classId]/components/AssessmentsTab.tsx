import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import type { AssessmentDTO, StudentAssessmentScoreDTO } from '@/types/studentClass';
import { ASSESSMENT_KINDS } from '@/types/studentClass';
import { cn } from '@/lib/utils';

interface AssessmentsTabProps {
  assessments: AssessmentDTO[];
  isLoading: boolean;
  scores: StudentAssessmentScoreDTO[];
}

type FilterType = 'all' | 'upcoming' | 'graded' | 'overdue';

const AssessmentsTab: React.FC<AssessmentsTabProps> = ({ assessments, isLoading, scores }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scoreMap = useMemo(
    () => new Map(scores.map((score) => [score.assessmentId, score])),
    [scores]
  );

  const filteredAssessments = useMemo(() => {
    const now = new Date();
    return assessments.filter((assessment) => {
      const assessmentDate = new Date(assessment.scheduledDate);
      const score = scoreMap.get(assessment.id);

      switch (filter) {
        case 'upcoming':
          return assessmentDate > now && !score;
        case 'graded':
          return !!score?.isGraded;
        case 'overdue':
          return assessmentDate < now && (!score || !score.isSubmitted);
        default:
          return true;
      }
    });
  }, [assessments, filter, scoreMap]);

  const getAssessmentKindColor = (kind: string) => {
    switch (kind) {
      case 'QUIZ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MIDTERM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FINAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ASSIGNMENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PROJECT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (assessment: AssessmentDTO, score?: StudentAssessmentScoreDTO) => {
    const now = new Date();
    const assessmentDate = new Date(assessment.scheduledDate);

    if (score && score.isGraded) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã chấm điểm
        </Badge>
      );
    }

    if (score && score.isSubmitted && !score.isGraded) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Chờ chấm điểm
        </Badge>
      );
    }

    if (assessmentDate < now) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Quá hạn
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Calendar className="h-3 w-3 mr-1" />
        Sắp diễn ra
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bài kiểm tra & Đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Bài kiểm tra & Điểm</h3>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'upcoming', label: 'Sắp tới' },
            { key: 'graded', label: 'Đã chấm' },
            { key: 'overdue', label: 'Quá hạn' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                filter === tab.key
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent>
          {filteredAssessments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên bài</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
                    const score = scoreMap.get(assessment.id);
                    const scorePercentage =
                      assessment.maxScore && score?.score != null
                        ? (score.score / assessment.maxScore) * 100
                        : undefined;

                    return (
                      <TableRow key={assessment.id}>
                        <TableCell className="max-w-xs">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">{assessment.name}</span>
                            {assessment.description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {assessment.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", getAssessmentKindColor(assessment.kind))}>
                            {ASSESSMENT_KINDS[assessment.kind]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(assessment.scheduledDate)}</span>
                          </div>
                          {assessment.durationMinutes && (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              <span>{assessment.durationMinutes} phút</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assessment.teacherName || '—'}
                        </TableCell>
                        <TableCell>{getStatusBadge(assessment, score)}</TableCell>
                        <TableCell className="text-right">
                          {score?.score != null ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold text-foreground">
                                {score.score}/{assessment.maxScore}
                              </span>
                              {scorePercentage !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {scorePercentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Chưa có điểm</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              {filter === 'all'
                ? 'Chưa có bài kiểm tra nào.'
                : 'Không có bài theo bộ lọc hiện tại.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentsTab;
