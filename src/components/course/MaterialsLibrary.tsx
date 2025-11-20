import { useState } from 'react'
import type { MaterialHierarchy, CourseMaterial } from '@/store/services/courseApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  Image,
  Music,
  Download,
  Eye,
  Lock,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MaterialsLibraryProps {
  courseId: number
  materials: MaterialHierarchy
}

export function MaterialsLibrary({ materials }: MaterialsLibraryProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<string>('Tất cả')

  const materialTypes = ['Tất cả', 'Video', 'PDF', 'Slide', 'Audio', 'Hình ảnh']

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

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const filterMaterials = (materialList: CourseMaterial[]) => {
    if (activeFilter === 'Tất cả') return materialList

    return materialList.filter(material => {
      const materialType = getMaterialTypeLabel(material.materialType)
      return materialType === activeFilter
    })
  }

  const filteredCourseLevelMaterials = filterMaterials(materials.courseLevel || [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Tài liệu học tập</h2>
        <p className="text-gray-600">
          {materials.totalMaterials} tài liệu • {materials.accessibleMaterials} có sẵn
        </p>
      </div>

      {/* Material Type Filter */}
      <div className="flex flex-wrap gap-2">
        {materialTypes.map((type) => (
          <Button
            key={type}
            variant={activeFilter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(type)}
            className="h-8"
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Course-level Materials */}
      {filteredCourseLevelMaterials.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">📚 Tài liệu khóa học</h3>
            <Badge variant="secondary">{filteredCourseLevelMaterials.length}</Badge>
          </div>

          <div className="grid gap-3">
            {filteredCourseLevelMaterials.map((material) => (
              <MaterialItem key={material.id} material={material} />
            ))}
          </div>
        </div>
      )}

      {/* Phase-level Materials */}
      {materials.phases?.map((phase) => {
        const filteredPhaseMaterials = filterMaterials(phase.materials || [])
        const filteredSessionMaterials = phase.sessions
          ?.flatMap(session => filterMaterials(session.materials || []))
          .length || 0

        const totalFilteredMaterials = filteredPhaseMaterials.length + filteredSessionMaterials

        if (totalFilteredMaterials === 0 && activeFilter !== 'Tất cả') {
          return null
        }

        return (
          <div key={phase.id} className="space-y-4">
            <button
              onClick={() => togglePhase(phase.id.toString())}
              className="flex items-center gap-2 text-lg font-semibold hover:text-blue-600 transition-colors"
            >
              {expandedPhases.has(phase.id.toString()) ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              Phase {phase.phaseNumber}: {phase.name}
              {activeFilter === 'Tất cả' && (
                <Badge variant="outline">{phase.totalMaterials}</Badge>
              )}
              {activeFilter !== 'Tất cả' && totalFilteredMaterials > 0 && (
                <Badge variant="outline">{totalFilteredMaterials}</Badge>
              )}
            </button>

            {expandedPhases.has(phase.id.toString()) && (
              <div className="pl-7 space-y-4">
                {/* Phase Materials */}
                {filteredPhaseMaterials.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-base font-medium text-gray-700">Tài liệu giai đoạn</h4>
                    <div className="grid gap-3">
                      {filteredPhaseMaterials.map((material) => (
                        <MaterialItem key={material.id} material={material} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Session Materials */}
                {phase.sessions?.map((session) => {
                  const filteredSessionMaterials = filterMaterials(session.materials || [])

                  if (filteredSessionMaterials.length === 0 && activeFilter !== 'Tất cả') {
                    return null
                  }

                  return (
                    <div key={session.id} className="space-y-3">
                      <button
                        onClick={() => toggleSession(session.id.toString())}
                        className="flex items-center gap-2 text-base font-medium hover:text-blue-600 transition-colors"
                      >
                        {expandedSessions.has(session.id.toString()) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        Session {session.sequenceNo}: {session.topic}
                        {activeFilter === 'Tất cả' && session.totalMaterials > 0 && (
                          <Badge variant="secondary">{session.totalMaterials}</Badge>
                        )}
                        {activeFilter !== 'Tất cả' && filteredSessionMaterials.length > 0 && (
                          <Badge variant="secondary">{filteredSessionMaterials.length}</Badge>
                        )}
                      </button>

                      {expandedSessions.has(session.id.toString()) && (
                        <div className="pl-7 grid gap-3">
                          {filteredSessionMaterials.map((material) => (
                            <MaterialItem key={material.id} material={material} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty State */}
      {filteredCourseLevelMaterials.length === 0 &&
       !materials.phases?.some(phase => {
         const filteredPhaseMaterials = filterMaterials(phase.materials || [])
         const filteredSessionMaterials = phase.sessions
           ?.flatMap(session => filterMaterials(session.materials || []))
           .length || 0
         return filteredPhaseMaterials.length > 0 || filteredSessionMaterials > 0
       }) && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có tài liệu nào</h3>
            <p className="text-gray-600">
              Không tìm thấy tài liệu loại "{activeFilter}" cho khóa học này.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MaterialItemProps {
  material: CourseMaterial
}

function MaterialItem({ material }: MaterialItemProps) {
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
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      !material.isAccessible && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {material.isAccessible ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Material Icon */}
            <div className="flex-shrink-0 text-gray-600">
              {getMaterialIcon(material.materialType)}
            </div>

            {/* Material Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {material.title}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {getMaterialTypeLabel(material.materialType)}
                </Badge>
              </div>
              {material.description && (
                <p className="text-sm text-gray-600 line-clamp-1">
                  {material.description}
                </p>
              )}
              {material.fileSize && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(material.fileSize)}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={!material.isAccessible}
              className="h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Xem
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!material.isAccessible}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-1" />
              Tải
            </Button>
          </div>
        </div>

        {/* Access Status Message */}
        {!material.isAccessible && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">
              Tài liệu này sẽ khả dụng khi bắt đầu giai đoạn/buổi học tương ứng
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}