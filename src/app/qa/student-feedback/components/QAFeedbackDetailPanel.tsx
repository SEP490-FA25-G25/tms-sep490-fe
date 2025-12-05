import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, CheckCircle2, Clock, Loader2, MessageSquare, Star, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useGetFeedbackDetailQuery } from '@/store/services/qaApi'
import type { StudentFeedbackListResponse } from '@/types/qa'

type FeedbackListItem = StudentFeedbackListResponse['feedbacks'][number]

interface QAFeedbackDetailPanelProps {
  feedback: FeedbackListItem
  classCode: string
  className: string
}

export function QAFeedbackDetailPanel({ feedback, classCode, className }: QAFeedbackDetailPanelProps) {
  const { data: detail, isLoading } = useGetFeedbackDetailQuery(feedback.feedbackId, {
    skip: !feedback.isFeedback,
  })

  const formatDate = (value?: string) => {
    if (!value) return '—'
    try {
      return format(parseISO(value), "HH:mm dd/MM/yyyy", { locale: vi })
    } catch {
      return value
    }
  }

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: 'Rất tệ',
      2: 'Tệ',
      3: 'Bình thường',
      4: 'Tốt',
      5: 'Rất tốt',
    }
    return labels[Math.round(rating)] || `${rating}/5`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-emerald-600'
    if (rating >= 3) return 'text-amber-600'
    return 'text-rose-600'
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-sm px-2 font-medium">
                {classCode}
              </Badge>
              {feedback.phaseName && (
                <Badge variant="outline" className="rounded-sm px-2 font-normal">
                  {feedback.phaseName}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm px-2",
                  feedback.isFeedback
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {feedback.isFeedback ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Đã nộp
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Chưa nộp
                  </>
                )}
              </Badge>
            </div>
            <h2 className="text-lg lg:text-xl font-bold line-clamp-2">
              Phản hồi từ {feedback.studentName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {className}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
          {/* Info section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Học viên:</span>
              <span className="font-medium">{feedback.studentName}</span>
            </div>
            {feedback.submittedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Nộp lúc:</span>
                <span>{formatDate(feedback.submittedAt)}</span>
              </div>
            )}
          </div>

          {feedback.isFeedback ? (
            <>
              <Separator />

              {/* Rating Summary */}
              {feedback.rating != null && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Tổng quan đánh giá
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Điểm trung bình</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-5 w-5',
                                star <= Math.round(feedback.rating!)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-transparent text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                        <span className={cn('font-bold text-lg', getRatingColor(feedback.rating))}>
                          {feedback.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({getRatingLabel(feedback.rating)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Preview */}
              {feedback.responsePreview && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Nội dung phản hồi
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {detail?.response || feedback.responsePreview}
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Responses */}
              {detail?.detailedResponses && detail.detailedResponses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Chi tiết đánh giá theo tiêu chí
                  </h3>
                  <div className="space-y-2">
                    {detail.detailedResponses.map((response, index) => {
                      const rating = response.answerText ? parseInt(response.answerText) : 0
                      return (
                        <div
                          key={response.questionId}
                          className="flex items-start justify-between gap-3 bg-muted/20 rounded-lg px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="text-muted-foreground mr-2">{index + 1}.</span>
                              {response.questionText}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    'h-4 w-4',
                                    star <= rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-transparent text-muted-foreground/30'
                                  )}
                                />
                              ))}
                            </div>
                            <span className={cn(
                              'font-semibold text-sm min-w-[32px] text-right',
                              getRatingColor(rating)
                            )}>
                              {rating}/5
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Separator />
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">Học viên chưa nộp phản hồi</p>
                <p className="text-xs mt-1">Phản hồi sẽ hiển thị khi học viên hoàn thành</p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default QAFeedbackDetailPanel
