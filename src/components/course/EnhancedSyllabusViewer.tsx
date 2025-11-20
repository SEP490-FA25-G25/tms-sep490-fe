import type { CoursePhase, MaterialHierarchy, CourseAssessment } from '@/store/services/courseApi'
import { useState } from 'react'
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
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface EnhancedSyllabusViewerProps {
  phases: CoursePhase[]
  materials?: MaterialHierarchy
  assessments?: CourseAssessment[]
}

export function EnhancedSyllabusViewer({ phases, materials, assessments }: EnhancedSyllabusViewerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const toggleSession = (sessionId: number) => {
    const next = new Set(expandedSessions)
    if (next.has(sessionId)) {
      next.delete(sessionId)
    } else {
      next.add(sessionId)
    }
    setExpandedSessions(next)
  }

  
  // Helper function to get materials for a specific session
  const getSessionMaterials = (sessionId: number) => {
    if (!materials) return []

    // Check session-level materials
    for (const phase of materials.phases || []) {
      const session = phase.sessions?.find(s => s.id === sessionId)
      if (session) {
        return session.materials || []
      }
    }

    return []
  }

  const getMaterialIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />
      case 'SLIDE':
      case 'PRESENTATION':
        return <BookOpen className="h-4 w-4" />
      case 'AUDIO':
        return <Music className="h-4 w-4" />
      case 'IMAGE':
        return <Image className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getMaterialTypeLabel = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'VIDEO':
        return 'Video'
      case 'PDF':
      case 'DOCUMENT':
        return 'PDF'
      case 'SLIDE':
      case 'PRESENTATION':
        return 'Slide'
      case 'AUDIO':
        return 'Audio'
      case 'IMAGE':
        return 'Hình ảnh'
      default:
        return 'Tài liệu'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getAssessmentTypeLabel = (assessmentType?: string) => {
    switch (assessmentType?.toUpperCase()) {
      case 'QUIZ':
        return 'Quiz'
      case 'MIDTERM':
        return 'Midterm'
      case 'FINAL':
        return 'Final'
      case 'ASSIGNMENT':
        return 'Assignment'
      case 'PROJECT':
        return 'Project'
      case 'ORAL':
        return 'Oral'
      case 'PRACTICE':
        return 'Practice'
      default:
        return assessmentType || 'Khác'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Giáo trình khóa học</h2>
        <p className="text-muted-foreground">
          {phases.length} giai đoạn • {phases.reduce((total, phase) => total + (phase.totalSessions || 0), 0)} buổi học
          {materials && ` • ${materials.totalMaterials} tài liệu`}
        </p>
      </div>

      {/* Course-level Materials */}
      {materials?.courseLevel && materials.courseLevel.length > 0 && (
        <div className="space-y-3" id="tai-lieu-khoa-hoc">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Tài liệu khóa học</h3>
            <Badge variant="secondary">{materials.courseLevel.length}</Badge>
          </div>
          <div className="rounded-lg border divide-y overflow-hidden bg-white">
            {materials.courseLevel.map((material) => (
              <div key={material.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 text-muted-foreground">
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
                    <Button size="icon" variant="ghost" aria-label="Xem tài liệu">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Tải tài liệu">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Phases with Sessions - Using Accordion */}
      <div className="space-y-4" id="noi-dung-chi-tiet">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Nội dung chi tiết</h3>
        </div>

        <div className="space-y-3">
          {phases.map((phase) => (
            <Collapsible
              key={phase.id}
              open={expandedPhases.has(phase.id.toString())}
              onOpenChange={() => togglePhase(phase.id.toString())}
              className="rounded-xl border bg-white"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full px-5 py-4 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Giai đoạn {phase.phaseNumber}</p>
                      <div className="text-base font-semibold text-foreground">{phase.name}</div>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {phase.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {phase.totalSessions && <span>{phase.totalSessions} buổi</span>}
                      {materials?.phases?.find(p => p.id === phase.id)?.totalMaterials && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {materials.phases.find(p => p.id === phase.id)?.totalMaterials} tài liệu
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-5 pb-5 space-y-4">
                {phase.sessions?.length ? (
                  phase.sessions.map((session) => {
                    const sessionMaterials = getSessionMaterials(session.id)
                    const isOpen = expandedSessions.has(session.id)

                    return (
                      <div key={session.id} className="border-t first:border-t-0 ">
                        <button
                          type="button"
                          onClick={() => toggleSession(session.id)}
                          className="w-full px-4 py-2 flex items-start justify-between gap-3 text-left rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-base text-foreground">
                                Buổi {session.sequenceNo}: {session.topic}
                              </h4>
                              {session.isCompleted && (
                                <Badge variant="default" className="bg-success hover:bg-success/90">
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
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pl-2">
                            {sessionMaterials.length > 0 && (
                              <span>{sessionMaterials.length} tài liệu</span>
                            )}
                            <span className="text-primary font-medium">{isOpen ? 'Ẩn' : 'Xem'}</span>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-5 pt-2 space-y-4">
                            {session.objectives && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <Target className="h-4 w-4 text-primary" />
                                  <span>Mục tiêu buổi học</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {session.objectives}
                                </p>
                              </div>
                            )}

                            {session.skillSets && session.skillSets.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {session.skillSets.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="rounded-full bg-muted px-2 py-1 uppercase tracking-wide font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {sessionMaterials.length > 0 && (
                              <div className="rounded-lg border overflow-hidden bg-muted/20">
                                {sessionMaterials.map((material) => (
                                  <div
                                    key={material.id}
                                    className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
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
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có buổi học trong giai đoạn này</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Course Assessments */}
      {assessments && assessments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3" id="ke-hoach-danh-gia">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Kế hoạch đánh giá</h3>
              <Badge variant="secondary">{assessments.length}</Badge>
            </div>
            <div className="rounded-lg border overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[240px]">Bài đánh giá</TableHead>
                    <TableHead className="w-[120px]">Loại</TableHead>
                    <TableHead className="w-[120px]">Thời lượng</TableHead>
                    <TableHead className="w-[120px]">Điểm tối đa</TableHead>
                    <TableHead>CLO liên kết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <div className="font-semibold">{assessment.name}</div>
                        {assessment.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assessment.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase tracking-wide">
                          {getAssessmentTypeLabel(assessment.assessmentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.duration ? `${assessment.duration} phút` : '—'}
                      </TableCell>
                      <TableCell>
                        {assessment.maxScore ?? '—'}
                      </TableCell>
                      <TableCell>
                        {assessment.cloMappings && assessment.cloMappings.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {assessment.cloMappings.map((clo, idx) => (
                              <Badge key={idx} variant="secondary" className="uppercase">
                                {clo}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Chưa liên kết CLO</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
