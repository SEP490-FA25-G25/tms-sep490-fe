import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ENROLLMENT_STATUS_STYLES, getStatusStyle, ASSESSMENT_KIND_STYLES } from '@/lib/status-colors';
import type { StudentTranscriptDTO } from '@/store/services/studentApi';
import { useGetClassAssessmentsQuery, useGetStudentAssessmentScoresQuery } from '@/store/services/studentClassApi';
import { useAuth } from '@/contexts/AuthContext';
import type { AssessmentDTO, StudentAssessmentScoreDTO } from '@/types/studentClass';
import { ASSESSMENT_KINDS } from '@/types/studentClass';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  User,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface TranscriptDetailPanelProps {
  selectedClass: StudentTranscriptDTO;
}

interface SelectedAssessmentDetail {
  assessment: AssessmentDTO;
  score?: StudentAssessmentScoreDTO;
}

const TranscriptDetailPanel: React.FC<TranscriptDetailPanelProps> = ({
  selectedClass,
}) => {
  const { user } = useAuth();
  const [selectedDetail, setSelectedDetail] = useState<SelectedAssessmentDetail | null>(null);

  const {
    data: assessmentsResponse,
    isLoading: isAssessmentsLoading,
  } = useGetClassAssessmentsQuery(
    { classId: selectedClass.classId },
    { skip: !selectedClass }
  );

  const {
    data: scoresResponse,
    isLoading: isScoresLoading,
  } = useGetStudentAssessmentScoresQuery(
    { classId: selectedClass.classId, studentId: user?.id || 0 },
    { skip: !selectedClass || !user?.id }
  );

  const assessments = assessmentsResponse?.data || [];
  const scores = scoresResponse?.data || [];

  const scoreMap = useMemo(
    () => new Map(scores.map((score) => [score.assessmentId, score])),
    [scores]
  );

  const isLoading = isAssessmentsLoading || isScoresLoading;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'Đang học';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'DROPPED':
        return 'Đã nghỉ';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAssessmentStatus = (assessment: AssessmentDTO, score?: StudentAssessmentScoreDTO) => {
    if (score?.isGraded) {
      return { label: 'Đã chấm điểm', variant: 'success' as const };
    }
    if (score?.isSubmitted) {
      return { label: 'Chờ chấm điểm', variant: 'warning' as const };
    }
    const now = new Date();
    const assessmentDate = new Date(assessment.scheduledDate);
    if (assessmentDate < now) {
      return { label: 'Quá hạn', variant: 'destructive' as const };
    }
    return { label: 'Sắp diễn ra', variant: 'outline' as const };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-lg lg:text-xl font-bold line-clamp-2">
              {selectedClass.className}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-mono text-xs">{selectedClass.classCode}</span>
              <span>•</span>
              <span className="text-xs">{selectedClass.courseName}</span>
            </div>
          </div>
          <Badge
            className={cn(
              'shrink-0 text-xs',
              getStatusStyle(ENROLLMENT_STATUS_STYLES, selectedClass.status)
            )}
          >
            {getStatusText(selectedClass.status)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
          {/* Assessment Details */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Điểm thành phần
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assessments.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Bài kiểm tra</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ngày</span>
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Thời lượng</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Điểm</TableHead>
                      <TableHead className="hidden lg:table-cell">Chấm bởi</TableHead>
                      <TableHead className="hidden lg:table-cell">Ngày chấm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => {
                      const score = scoreMap.get(assessment.id);
                      const status = getAssessmentStatus(assessment, score);
                      
                      return (
                        <TableRow 
                          key={assessment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedDetail({ assessment, score })}
                        >
                          <TableCell>
                            <p className="font-medium text-sm line-clamp-2">{assessment.name}</p>
                            {assessment.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {assessment.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                getStatusStyle(ASSESSMENT_KIND_STYLES, assessment.kind)
                              )}
                            >
                              {ASSESSMENT_KINDS[assessment.kind]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm whitespace-nowrap">
                              {formatDate(assessment.scheduledDate)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {assessment.durationMinutes ? (
                              <span className="text-sm text-muted-foreground">
                                {assessment.durationMinutes} phút
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {score?.score != null ? (
                              <span className={cn(
                                'font-semibold',
                                getScoreColor(score.score, assessment.maxScore)
                              )}>
                                {score.score}/{assessment.maxScore}
                              </span>
                            ) : (
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {score?.gradedBy ? (
                              <span className="text-sm">{score.gradedBy}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {score?.gradedAt ? (
                              <span className="text-sm">{formatDate(score.gradedAt)}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/30">
                <GraduationCap className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                Chưa có bài kiểm tra nào
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Assessment Detail Dialog */}
      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Chi tiết bài kiểm tra
            </DialogTitle>
          </DialogHeader>
          
          {selectedDetail && (
            <div className="space-y-4">
              {/* Assessment Info */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{selectedDetail.assessment.name}</h4>
                  {selectedDetail.assessment.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedDetail.assessment.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Loại:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        getStatusStyle(ASSESSMENT_KIND_STYLES, selectedDetail.assessment.kind)
                      )}
                    >
                      {ASSESSMENT_KINDS[selectedDetail.assessment.kind]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ngày:</span>
                    <span>{formatDate(selectedDetail.assessment.scheduledDate)}</span>
                  </div>
                  {selectedDetail.assessment.durationMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Thời lượng:</span>
                      <span>{selectedDetail.assessment.durationMinutes} phút</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Section */}
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium mb-3">Kết quả</h5>
                {selectedDetail.score?.score != null ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Điểm số</span>
                      <div className="text-right">
                        <span className={cn(
                          'text-lg font-bold',
                          getScoreColor(selectedDetail.score.score, selectedDetail.assessment.maxScore)
                        )}>
                          {selectedDetail.score.score}/{selectedDetail.assessment.maxScore}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({((selectedDetail.score.score / selectedDetail.assessment.maxScore) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {selectedDetail.score.feedback && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Nhận xét từ giáo viên
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                          {selectedDetail.score.feedback}
                        </p>
                      </div>
                    )}

                    {selectedDetail.score.gradedBy && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Chấm bởi: <span className="font-medium text-foreground">{selectedDetail.score.gradedBy}</span></span>
                        {selectedDetail.score.gradedAt && (
                          <>
                            <span>•</span>
                            <span>{formatDate(selectedDetail.score.gradedAt)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    <Badge variant={getAssessmentStatus(selectedDetail.assessment, selectedDetail.score).variant} className="text-xs">
                      {getAssessmentStatus(selectedDetail.assessment, selectedDetail.score).label}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranscriptDetailPanel;
