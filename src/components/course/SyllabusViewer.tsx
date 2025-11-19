import type { CoursePhase } from '@/store/services/courseApi'
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { useState } from 'react'

interface SyllabusViewerProps {
  phases: CoursePhase[]
}

export function SyllabusViewer({ phases }: SyllabusViewerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Đề cương chi tiết</h2>
        <p className="text-gray-600">
          {phases.length} giai đoạn • {phases.reduce((total, phase) => total + (phase.totalSessions || 0), 0)} buổi học
        </p>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="border rounded-lg">
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase.id.toString())}
              className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              {expandedPhases.has(phase.id.toString()) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg">
                  Phase {phase.phaseNumber}: {phase.name}
                </h3>
                {phase.description && (
                  <p className="text-gray-600 mt-1">{phase.description}</p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {phase.totalSessions} buổi học
              </div>
            </button>

            {/* Expanded Content */}
            {expandedPhases.has(phase.id.toString()) && (
              <div className="px-6 pb-4 border-t">
                <div className="pt-4 space-y-3">
                  {phase.sessions?.map((session) => (
                    <div key={session.id} className="border-l-2 border-gray-200 pl-4">
                      <button
                        onClick={() => toggleSession(session.id.toString())}
                        className="w-full text-left hover:bg-gray-50 rounded p-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedSessions.has(session.id.toString()) ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <h4 className="font-medium">
                              Session {session.sequenceNo}: {session.topic}
                            </h4>
                            {session.description && (
                              <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                            )}
                          </div>
                        </div>
                      </button>

                      {expandedSessions.has(session.id.toString()) && (
                        <div className="ml-6 mt-3 p-3 bg-gray-50 rounded space-y-2">
                          {session.objectives && (
                            <div>
                              <h5 className="font-medium text-sm text-gray-700 mb-1">Mục tiêu:</h5>
                              <p className="text-sm text-gray-600">{session.objectives}</p>
                            </div>
                          )}
                          {session.skillSets && session.skillSets.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm text-gray-700 mb-1">Kỹ năng:</h5>
                              <div className="flex flex-wrap gap-1">
                                {session.skillSets.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.totalMaterials !== undefined && session.totalMaterials > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{session.totalMaterials} tài liệu</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}