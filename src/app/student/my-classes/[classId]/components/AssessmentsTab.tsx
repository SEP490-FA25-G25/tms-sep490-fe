import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, Clock, FileText } from 'lucide-react';
import type { AssessmentDTO, StudentAssessmentScoreDTO } from '@/types/studentClass';
import { ASSESSMENT_KINDS } from '@/types/studentClass';
import { cn } from '@/lib/utils';
import { ASSESSMENT_KIND_STYLES, getStatusStyle } from '@/lib/status-colors';

interface AssessmentsTabProps {
  assessments: AssessmentDTO[];
  isLoading: boolean;
  scores: StudentAssessmentScoreDTO[];
  averageScore?: number;
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

  const getStatusBadge = (assessment: AssessmentDTO, score?: StudentAssessmentScoreDTO) => {
    const now = new Date();
    const assessmentDate = new Date(assessment.scheduledDate);

    if (score && score.isGraded) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Đã chấm điểm
        </Badge>
      );
    }

    if (score && score.isSubmitted && !score.isGraded) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Chờ chấm điểm
        </Badge>
      );
    }

    if (assessmentDate < now) {
      return (
        <Badge variant="destructive">
          Quá hạn
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        Sắp diễn ra
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Bài kiểm tra & Điểm</h3>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => setFilter(value as FilterType)}
          className="border rounded-lg p-1"
        >
          <ToggleGroupItem value="all" className="text-sm">
            Tất cả
          </ToggleGroupItem>
          <ToggleGroupItem value="upcoming" className="text-sm">
            Sắp tới
          </ToggleGroupItem>
          <ToggleGroupItem value="graded" className="text-sm">
            Đã chấm
          </ToggleGroupItem>
          <ToggleGroupItem value="overdue" className="text-sm">
            Quá hạn
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card className="overflow-hidden py-0">
        {filteredAssessments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tên bài</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời gian bắt đầu</TableHead>
                <TableHead>Thời lượng</TableHead>
                <TableHead>Giáo viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((assessment) => {
                const score = scoreMap.get(assessment.id);
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
                      <Badge className={cn("text-xs", getStatusStyle(ASSESSMENT_KIND_STYLES, assessment.kind))}>
                        {ASSESSMENT_KINDS[assessment.kind]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(assessment.scheduledDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {assessment.durationMinutes ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{assessment.durationMinutes} phút</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
        ) : (
          <div className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="h-10 w-10" />
                </EmptyMedia>
                <EmptyTitle>
                  {filter === 'all' ? 'Chưa có bài kiểm tra' : 'Không có bài nào theo bộ lọc'}
                </EmptyTitle>
                <EmptyDescription>
                  {filter === 'all'
                    ? 'Chưa có bài kiểm tra nào.'
                    : 'Không có bài theo bộ lọc hiện tại.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AssessmentsTab;
