"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Plus,
  ExternalLink 
} from "lucide-react"
import { Link } from "react-router-dom"
import type { DraftReport, CompletedPhaseInfo } from "@/types/qa"

// Map report type to shorter Vietnamese
const reportTypeShortLabels: Record<string, string> = {
  CLASSROOM_OBSERVATION: "Quan sát lớp",
  PHASE_REVIEW: "Đánh giá phase",
  CLO_ACHIEVEMENT_ANALYSIS: "Phân tích CLO",
  STUDENT_FEEDBACK_ANALYSIS: "Phân tích feedback",
  ATTENDANCE_ENGAGEMENT_REVIEW: "Đánh giá chuyên cần",
  TEACHING_QUALITY_ASSESSMENT: "Đánh giá CLGD",
}

interface QATasksPanelProps {
  draftReports: DraftReport[] | null | undefined
  completedPhases: CompletedPhaseInfo[] | null | undefined
  className?: string
}

export function QATasksPanel({ draftReports, completedPhases, className }: QATasksPanelProps) {
  const draftsCount = draftReports?.length ?? 0
  const phasesCount = completedPhases?.length ?? 0
  const totalTasks = draftsCount + phasesCount

  // Determine default tab based on which has items
  const defaultTab = draftsCount > 0 ? "drafts" : phasesCount > 0 ? "phases" : "drafts"

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Việc Cần Làm
          {totalTasks > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {totalTasks}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="drafts" className="text-xs gap-1">
              Báo cáo nháp
              {draftsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {draftsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="phases" className="text-xs gap-1">
              Phase cần review
              {phasesCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {phasesCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="flex-1 mt-2">
            <DraftReportsList reports={draftReports} />
          </TabsContent>

          <TabsContent value="phases" className="flex-1 mt-2">
            <CompletedPhasesList phases={completedPhases} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ========== Draft Reports List ==========
function DraftReportsList({ reports }: { reports: DraftReport[] | null | undefined }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
        <p className="text-sm text-muted-foreground">
          Không có báo cáo nháp nào
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tất cả báo cáo đã được submit!
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-2 pr-2">
        {reports.map((report) => (
          <Link
            key={report.reportId}
            to={`/qa/reports/${report.reportId}/edit`}
            className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm truncate">
                  {reportTypeShortLabels[report.reportType] || report.reportType}
                </span>
                <Badge variant="warning" className="h-5 text-[10px] px-1.5">
                  Nháp
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{report.classCode}</span>
                {report.phaseName && (
                  <>
                    <span>•</span>
                    <span>{report.phaseName}</span>
                  </>
                )}
                {report.lastUpdated && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(report.lastUpdated).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-amber-600 transition-colors" />
          </Link>
        ))}
      </div>
    </ScrollArea>
  )
}

// ========== Completed Phases List ==========
function CompletedPhasesList({ phases }: { phases: CompletedPhaseInfo[] | null | undefined }) {
  if (!phases || phases.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-6">
        <Clock className="h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm text-muted-foreground">
          Không có phase nào vừa kết thúc
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Các phase mới hoàn thành sẽ hiện ở đây
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-2 pr-2">
        {phases.map((phase) => {
          const needsPhaseReview = !phase.hasPhaseReview
          const needsFeedback = !phase.hasFeedbackAnalysis
          const needsAction = needsPhaseReview || needsFeedback

          return (
            <div
              key={`${phase.classId}-${phase.phaseId}`}
              className={cn(
                "p-2.5 rounded-lg border bg-card",
                needsAction && "border-purple-200 dark:border-purple-900"
              )}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate font-mono">
                      {phase.classCode}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "h-5 text-[10px] px-1.5",
                        phase.daysSinceEnded <= 3 
                          ? "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30" 
                          : "text-slate-600 border-slate-300"
                      )}
                    >
                      {phase.daysSinceEnded === 0 
                        ? "Hôm nay" 
                        : phase.daysSinceEnded === 1 
                          ? "Hôm qua"
                          : `${phase.daysSinceEnded} ngày trước`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {phase.phaseName} • {phase.totalSessions} buổi
                  </div>
                </div>
                <Link 
                  to={`/qa/classes/${phase.classId}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Report Status Indicators */}
              <div className="flex items-center gap-3 mt-2">
                <ReportStatusIndicator 
                  label="Phase Review"
                  done={phase.hasPhaseReview}
                  classId={phase.classId}
                  phaseId={phase.phaseId}
                  reportType="PHASE_REVIEW"
                />
                <ReportStatusIndicator 
                  label="Feedback"
                  done={phase.hasFeedbackAnalysis}
                  classId={phase.classId}
                  phaseId={phase.phaseId}
                  reportType="STUDENT_FEEDBACK_ANALYSIS"
                />
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

// ========== Report Status Indicator ==========
function ReportStatusIndicator({ 
  label, 
  done,
  classId,
  phaseId,
  reportType
}: { 
  label: string
  done: boolean
  classId: number
  phaseId: number
  reportType: string
}) {
  if (done) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <Link 
      to={`/qa/reports/create?classId=${classId}&phaseId=${phaseId}&reportType=${reportType}`}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-purple-600 transition-colors"
    >
      <Circle className="h-3.5 w-3.5" />
      <span>{label}</span>
      <Plus className="h-3 w-3" />
    </Link>
  )
}
