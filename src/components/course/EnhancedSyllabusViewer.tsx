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

interface EnhancedSyllabusViewerProps {
  phases: CoursePhase[]
  materials?: MaterialHierarchy
  assessments?: CourseAssessment[]
}

export function EnhancedSyllabusViewer({ phases, materials, assessments }: EnhancedSyllabusViewerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Đề cương khóa học</h2>
        <p className="text-muted-foreground">
          {phases.length} giai đoạn • {phases.reduce((total, phase) => total + (phase.totalSessions || 0), 0)} buổi học
          {materials && ` • ${materials.totalMaterials} tài liệu`}
        </p>
      </div>

      {/* Course-level Materials */}
      {materials?.courseLevel && materials.courseLevel.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Tài liệu khóa học</h3>
            <Badge variant="secondary">{materials.courseLevel.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.courseLevel.map((material) => (
              <div key={material.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Phases with Sessions - Using Accordion */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Nội dung chi tiết</h3>

        <div className="space-y-4">
          {phases.map((phase) => (
            <Collapsible
              key={phase.id}
              open={expandedPhases.has(phase.id.toString())}
              onOpenChange={() => togglePhase(phase.id.toString())}
              className="border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full p-6 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">
                        Giai đoạn {phase.phaseNumber}: {phase.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{phase.totalSessions} buổi</Badge>
                      {materials?.phases?.find(p => p.id === phase.id)?.totalMaterials && (
                        <Badge variant="secondary">
                          {materials.phases.find(p => p.id === phase.id)?.totalMaterials} tài liệu
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-6 pb-6">
                {phase.description && (
                  <p className="text-muted-foreground mb-6">{phase.description}</p>
                )}

                <div className="space-y-4">
                  {phase.sessions?.map((session) => {
                    const sessionMaterials = getSessionMaterials(session.id)

                    return (
                      <div key={session.id} className="py-6 border-b last:border-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-base">
                              Buổi {session.sequenceNo}: {session.topic}
                            </h4>
                            <div className="flex items-center gap-2">
                              {session.isCompleted && (
                                <Badge variant="default" className="text-xs bg-success hover:bg-success/90">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Hoàn thành
                                </Badge>
                              )}
                              {sessionMaterials.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {sessionMaterials.length} tài liệu
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {session.description && (
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{session.description}</p>
                        )}

                        {/* Session Objectives */}
                        {session.objectives && (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-foreground">
                              <Target className="h-4 w-4 text-primary" />
                              Mục tiêu buổi học:
                            </h5>
                            <p className="text-sm text-muted-foreground pl-6">
                              {session.objectives}
                            </p>
                          </div>
                        )}

                        {/* Session Skills */}
                        {session.skillSets && session.skillSets.length > 0 && (
                          <div className="mb-4 pl-6">
                            <div className="flex flex-wrap gap-2">
                              {session.skillSets.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs font-normal">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Session Materials */}
                        {sessionMaterials.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm mb-3 flex items-center gap-2 text-foreground">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              Tài liệu cần thiết:
                            </h5>
                            <div className="space-y-2 pl-6">
                              {sessionMaterials.map((material) => (
                                <div key={material.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded transition-colors group">
                                  <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                                    {getMaterialIcon(material.materialType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h6 className="font-medium text-sm truncate">{material.title}</h6>
                                    <p className="text-xs text-muted-foreground">
                                      {getMaterialTypeLabel(material.materialType)}
                                      {material.fileSize && ` • ${formatFileSize(material.fileSize)}`}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Course Assessments */}
      {assessments && assessments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Kế hoạch đánh giá</h3>
              <Badge variant="secondary">{assessments.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border rounded-lg space-y-3 bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{assessment.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {assessment.assessmentType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {assessment.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{assessment.duration} phút</span>
                      </div>
                    )}
                    {assessment.maxScore && (
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4" />
                        <span>{assessment.maxScore} điểm</span>
                      </div>
                    )}
                  </div>

                  {assessment.description && (
                    <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                      {assessment.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}