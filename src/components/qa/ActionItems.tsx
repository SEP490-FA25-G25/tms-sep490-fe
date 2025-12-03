"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileEdit, ClipboardList, MessageSquare, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { ActionItems as ActionItemsType } from "@/types/qa"

interface ActionItemsProps {
  data: ActionItemsType | null | undefined
  className?: string
}

export function ActionItems({ data, className }: ActionItemsProps) {
  if (!data) {
    return null
  }

  const hasItems = 
    data.draftReportsCount > 0 || 
    data.phasesNeedingReviewCount > 0 || 
    data.unanalyzedFeedbackCount > 0

  if (!hasItems) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Việc Cần Xử Lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            🎉 Tuyệt vời! Không có việc cần xử lý.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Việc Cần Xử Lý
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Draft Reports */}
        {data.draftReportsCount > 0 && (
          <ActionItem
            icon={FileEdit}
            iconColor="text-amber-600"
            bgColor="bg-amber-50"
            count={data.draftReportsCount}
            label="báo cáo nháp chưa hoàn thành"
            linkTo="/qa/reports?status=DRAFT"
            items={data.draftReports?.map(r => ({
              id: r.reportId,
              title: r.classCode,
              subtitle: r.reportType,
              linkTo: `/qa/reports/${r.reportId}/edit`
            }))}
          />
        )}

        {/* Phases Needing Review */}
        {data.phasesNeedingReviewCount > 0 && (
          <ActionItem
            icon={ClipboardList}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            count={data.phasesNeedingReviewCount}
            label="giai đoạn cần đánh giá"
            linkTo="/qa/classes"
            items={data.phasesNeedingReview?.map(p => ({
              id: p.phaseId,
              title: p.classCode,
              subtitle: p.phaseName,
              linkTo: `/qa/reports/create?classId=${p.classId}&phaseId=${p.phaseId}&type=PHASE_REVIEW`
            }))}
          />
        )}

        {/* Unanalyzed Feedback */}
        {data.unanalyzedFeedbackCount > 0 && (
          <ActionItem
            icon={MessageSquare}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
            count={data.unanalyzedFeedbackCount}
            label="feedback chưa phân tích"
            linkTo="/qa/student-feedback"
            items={data.unanalyzedFeedbacks?.map(f => ({
              id: f.phaseId,
              title: f.classCode,
              subtitle: `${f.phaseName} (${f.feedbackCount} feedback)`,
              linkTo: `/qa/classes/${f.classId}/feedback?phaseId=${f.phaseId}`
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface ActionItemProps {
  icon: React.ElementType
  iconColor: string
  bgColor: string
  count: number
  label: string
  linkTo: string
  items?: Array<{
    id: number
    title: string
    subtitle: string
    linkTo: string
  }>
}

function ActionItem({ icon: Icon, iconColor, bgColor, count, label, linkTo, items }: ActionItemProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="rounded-lg border bg-card">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => items && items.length > 0 && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-md", bgColor)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                {count}
              </Badge>
              <span className="text-sm">{label}</span>
            </div>
          </div>
        </div>
        <Link to={linkTo} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            Xem <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Expandable items */}
      {expanded && items && items.length > 0 && (
        <div className="border-t px-3 py-2 space-y-1 bg-muted/30">
          {items.slice(0, 3).map((item) => (
            <Link 
              key={item.id} 
              to={item.linkTo}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted transition-colors text-sm"
            >
              <div>
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground ml-2 text-xs">{item.subtitle}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              +{items.length - 3} khác
            </div>
          )}
        </div>
      )}
    </div>
  )
}
