import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Info, BookOpen, PenTool, MessageCircle, Headphones, Brain } from 'lucide-react'
import type { SkillAssessmentDTO } from '@/store/services/classApi'
import { cn } from '@/lib/utils'

interface ReplacementAssessmentsPopoverProps {
  assessments: SkillAssessmentDTO[]
  className?: string
}

// Map skill types to Vietnamese icons and names
const skillConfig = {
  READING: { icon: BookOpen, name: 'Đọc hiểu', color: 'text-blue-600' },
  WRITING: { icon: PenTool, name: 'Viết', color: 'text-green-600' },
  SPEAKING: { icon: MessageCircle, name: 'Nói', color: 'text-orange-600' },
  LISTENING: { icon: Headphones, name: 'Nghe', color: 'text-purple-600' },
  GENERAL: { icon: Brain, name: 'Tổng quan', color: 'text-gray-600' },
} as const

export function ReplacementAssessmentsPopover({
  assessments,
  className
}: ReplacementAssessmentsPopoverProps) {
  const assessmentCount = assessments.length

  if (assessmentCount === 0) {
    return (
      <span className="text-sm text-muted-foreground">Chưa có bài kiểm tra</span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn("cursor-pointer", className)}>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Info className="h-3 w-3 mr-1" />
            {assessmentCount} bài kiểm tra
          </Badge>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 p-0"
        align="start"
        side="right"
      >
        <div className="border-b bg-gray-50 px-4 py-3">
          <h4 className="font-semibold text-sm">Chi tiết bài kiểm tra đánh giá</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {assessmentCount} bài kiểm tra gần nhất
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {assessments.map((assessment, index) => {
            const SkillIcon = skillConfig[assessment.skill].icon
            const skillName = skillConfig[assessment.skill].name
            const skillColor = skillConfig[assessment.skill].color

            return (
              <div
                key={assessment.id}
                className={cn(
                  "p-4 border-b last:border-b-0",
                  index % 2 === 0 && "bg-gray-50/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", skillColor)}>
                    <SkillIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{skillName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {assessment.level.code}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assessment.score} điểm
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Trình độ:</span> {assessment.level.name}
                      </div>
                      <div>
                        <span className="font-medium">Ngày kiểm tra:</span> {formatDate(assessment.assessmentDate)}
                      </div>
                      <div>
                        <span className="font-medium">Loại:</span> {assessment.assessmentType}
                      </div>
                      <div>
                        <span className="font-medium">Người đánh giá:</span> {assessment.assessedBy.fullName}
                      </div>
                      {assessment.note && (
                        <div className="pt-1">
                          <span className="font-medium">Ghi chú:</span>
                          <p className="text-gray-700 mt-0.5 italic">{assessment.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}