import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Download,
  Eye,
  CheckCircle,
  BookOpen,
  FileText,
  Video,
  Music,
  Image,
  Target,
  Award,
  Clock,
} from 'lucide-react';
import { useGetCourseSyllabusQuery, useGetCourseMaterialsQuery } from '@/store/services/courseApi';
import type { ClassDetailDTO } from '@/types/studentClass';

interface SyllabusTabProps {
  classDetail: ClassDetailDTO;
  isLoading?: boolean;
}

const SyllabusTab: React.FC<SyllabusTabProps> = ({ classDetail, isLoading }) => {
  const { user } = useAuth();
  const course = classDetail.course;
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase-0']); // Expand first phase by default
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

  // Fetch course syllabus and materials
  const {
    data: courseSyllabus,
    isLoading: syllabusLoading,
    error: syllabusError,
  } = useGetCourseSyllabusQuery(course.id);

  const {
    data: materials,
    isLoading: materialsLoading,
    error: materialsError,
  } = useGetCourseMaterialsQuery({
    courseId: course.id,
    studentId: user?.id,
  });

  const isLoadingData = isLoading || syllabusLoading || materialsLoading;
  const hasError = syllabusError || materialsError;


  // Helper functions
  const getMaterialIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />;
      case 'SLIDE':
      case 'PRESENTATION':
        return <BookOpen className="h-4 w-4" />;
      case 'AUDIO':
        return <Music className="h-4 w-4" />;
      case 'IMAGE':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMaterialTypeLabel = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'VIDEO':
        return 'Video';
      case 'PDF':
      case 'DOCUMENT':
        return 'PDF';
      case 'SLIDE':
      case 'PRESENTATION':
        return 'Slide';
      case 'AUDIO':
        return 'Audio';
      case 'IMAGE':
        return 'Hình ảnh';
      default:
        return 'Tài liệu';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };


  // Get materials for different levels
  const courseMaterials = materials?.courseLevel || [];
  const getMaterialsForPhase = (phaseId: number) => {
    return materials?.phases?.find(p => p.id === phaseId)?.materials || [];
  };
  const getMaterialsForSession = (sessionId: number) => {
    if (!materials?.phases) return [];
    for (const phase of materials.phases) {
      const session = phase.sessions?.find(s => s.id === sessionId);
      if (session) {
        return session.materials || [];
      }
    }
    return [];
  };


  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
        <BookOpen className="h-8 w-8 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Không thể tải giáo trình
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng thử lại sau ít phút.
          </p>
        </div>
      </div>
    );
  }

  const phases = courseSyllabus?.phases || [];

  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Tổng quan khóa học
        </h3>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Tên khóa học</h4>
              <p className="text-base font-semibold">{course.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Mã: {course.code}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Tổng thời gian học</span>
                </div>
                <p className="text-base text-foreground">
                  {courseSyllabus?.totalHours || 0} giờ
                  {courseSyllabus?.totalDurationWeeks && courseSyllabus.totalDurationWeeks > 0 && ` (${courseSyllabus.totalDurationWeeks} tuần)`}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Cấu trúc khóa học</span>
                </div>
                <p className="text-base text-foreground">
                  {courseSyllabus?.numberOfSessions || 0} buổi học
                  {courseSyllabus?.hoursPerSession && ` • ${courseSyllabus.hoursPerSession} giờ/buổi`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseSyllabus?.subjectName && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Khung chương trình</h4>
                  <p className="text-base text-foreground">{courseSyllabus.subjectName}</p>
                </div>
              )}

              {courseSyllabus?.levelName && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Trình độ</h4>
                  <p className="text-base text-foreground">{courseSyllabus.levelName}</p>
                </div>
              )}
            </div>

            {courseSyllabus?.prerequisites && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Điều kiện tiên quyết</h4>
                <p className="text-base text-foreground">{courseSyllabus.prerequisites}</p>
              </div>
            )}

            {courseSyllabus?.teachingMethods && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Phương pháp giảng dạy</h4>
                <p className="text-base text-foreground">{courseSyllabus.teachingMethods}</p>
              </div>
            )}

            {courseSyllabus?.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Mô tả khóa học</h4>
                <p className="text-base text-foreground">
                  {courseSyllabus.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Materials */}
      {courseMaterials.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Tài liệu khóa học</h3>
            <Badge variant="secondary">{courseMaterials.length}</Badge>
          </div>

          <Card className="overflow-hidden py-0">
            <div className="divide-y">
              {courseMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="shrink-0 text-muted-foreground">
                    {getMaterialIcon(material.materialType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{material.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getMaterialTypeLabel(material.materialType)}
                      {material.fileSize && ` • ${formatFileSize(material.fileSize)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getMaterialTypeLabel(material.materialType)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Xem tài liệu"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Tải tài liệu"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Separator />

      {/* Detailed Course Content - 3-Tier Hierarchy */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Nội dung chi tiết</h3>
          <Badge variant="secondary">
            {phases.length} giai đoạn • {phases.reduce((total, phase) => total + (phase.totalSessions || 0), 0)} buổi học
          </Badge>
        </div>

        {phases.length > 0 ? (
          <Accordion
            type="multiple"
            value={expandedPhases}
            onValueChange={setExpandedPhases}
            className="space-y-3"
          >
            {phases.map((phase, phaseIndex) => {
              const phaseMaterials = getMaterialsForPhase(phase.id);
              const phaseId = `phase-${phaseIndex}`;

              return (
                <AccordionItem key={phase.id} value={phaseId} className="rounded-lg border bg-card last:border-b">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-start justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Giai đoạn {phase.phaseNumber}
                          {phase.durationWeeks && phase.durationWeeks > 0 && ` • ${phase.durationWeeks} tuần`}
                        </p>
                        <div className="text-base font-semibold text-foreground">
                          {phase.name}
                        </div>
                        {(phase.learningFocus || phase.description) && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {phase.learningFocus || phase.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                        {phase.totalSessions && <span>{phase.totalSessions} buổi</span>}
                        {phaseMaterials.length > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {phaseMaterials.length} tài liệu
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-5 space-y-4">
                    {/* Phase-level materials */}
                    {phaseMaterials.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>Tài liệu giai đoạn</span>
                        </div>
                        <div className="rounded-lg border divide-y overflow-hidden bg-muted/20">
                          {phaseMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                            >
                              <div className="shrink-0 text-muted-foreground">
                                {getMaterialIcon(material.materialType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h6 className="font-medium text-sm truncate">{material.title}</h6>
                                  <span className="text-xs text-muted-foreground">
                                    {getMaterialTypeLabel(material.materialType)}
                                  </span>
                                </div>
                                {material.fileSize && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(material.fileSize)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Xem tài liệu"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Tải tài liệu"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sessions within phase */}
                    {phase.sessions && phase.sessions.length > 0 ? (
                      <div className="space-y-3">
                        {phase.sessions.map((session) => {
                          const sessionMaterials = getMaterialsForSession(session.id);
                          const sessionId = `session-${session.id}`;

                          return (
                            <div key={session.id} className="border rounded-lg bg-card overflow-hidden">
                              <Accordion
                                type="single"
                                collapsible
                                value={expandedSessions.includes(sessionId) ? sessionId : undefined}
                                onValueChange={(value: string | undefined) => {
                                  if (value) {
                                    setExpandedSessions(prev => [...prev, sessionId]);
                                  } else {
                                    setExpandedSessions(prev => prev.filter(id => id !== sessionId));
                                  }
                                }}
                              >
                                <AccordionItem value={sessionId} className="border-b-0">
                                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-start justify-between gap-3 text-left w-full">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                          <h4 className="font-semibold text-base text-foreground">
                                            Buổi {session.sequenceNo}: {session.topic}
                                          </h4>
                                          {session.isCompleted && (
                                            <Badge variant="success">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Hoàn thành
                                            </Badge>
                                          )}
                                        </div>
                                        {session.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {session.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                        {sessionMaterials.length > 0 && (
                                          <span>{sessionMaterials.length} tài liệu</span>
                                        )}
                                      </div>
                                    </div>
                                  </AccordionTrigger>

                                  <AccordionContent className="px-4 pb-4 space-y-4">
                                    {/* Session Objectives */}
                                    {session.objectives && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                          <Target className="h-4 w-4 text-primary" />
                                          <span>Mục tiêu buổi học</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                          {session.objectives}
                                        </p>
                                      </div>
                                    )}

                                    {/* Session Skills */}
                                    {session.skill && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                          <Award className="h-4 w-4 text-primary" />
                                          <span>Kỹ năng</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <span
                                            className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                                          >
                                            {session.skill}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Session Materials */}
                                    {sessionMaterials.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                          <BookOpen className="h-4 w-4 text-primary" />
                                          <span>Tài liệu buổi học</span>
                                        </div>
                                        <div className="rounded-lg border divide-y overflow-hidden bg-muted/20">
                                          {sessionMaterials.map((material) => (
                                            <div
                                              key={material.id}
                                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                                            >
                                              <div className="shrink-0 text-muted-foreground">
                                                {getMaterialIcon(material.materialType)}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <h6 className="font-medium text-sm truncate">{material.title}</h6>
                                                  <span className="text-xs text-muted-foreground">
                                                    {getMaterialTypeLabel(material.materialType)}
                                                  </span>
                                                </div>
                                                {material.fileSize && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(material.fileSize)}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Xem tài liệu"
                                                  >
                                                    <Eye className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Tải tài liệu"
                                                  >
                                                    <Download className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có buổi học trong giai đoạn này
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Chưa có nội dung giáo trình chi tiết.
            </p>
          </div>
        )}
      </div>

      {/* Learning Outcomes */}
      {courseSyllabus?.clos && courseSyllabus.clos.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Mục tiêu học tập (CLO)
            </h3>

            <Card className="overflow-hidden py-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Mã CLO</TableHead>
                    <TableHead>Mô tả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSyllabus.clos.map((clo) => (
                    <TableRow key={clo.id}>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {clo.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-foreground flex-1">{clo.description}</p>
                          {clo.isAchieved && (
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        {clo.competencyLevel && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Trình độ: {clo.competencyLevel}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}

      {/* Cơ cấu điểm - Using CourseAssessment templates */}
      {courseSyllabus && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold">Cơ cấu điểm</h3>
              <Badge variant="secondary">{courseSyllabus.assessments?.length || 0}</Badge>
            </div>
            <Card className="overflow-hidden py-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Thành phần đánh giá</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Điểm tối đa</TableHead>
                    <TableHead>Thời lượng</TableHead>
                    <TableHead>CLO liên kết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSyllabus.assessments && courseSyllabus.assessments.length > 0 ? (
                    courseSyllabus.assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assessment.assessmentType || 'Chưa xác định'}
                          </Badge>
                        </TableCell>
                        <TableCell>{assessment.maxScore}</TableCell>
                        <TableCell>{assessment.duration || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assessment.cloMappings && assessment.cloMappings.length > 0 ? (
                              assessment.cloMappings.map((clo, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {clo}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Chưa có cơ cấu điểm cho khóa học này
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SyllabusTab;