import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Send, StarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  useSubmitFeedbackMutation,
  useGetQuestionsQuery,
  type PendingFeedback,
  type FeedbackQuestion,
} from '@/store/services/studentFeedbackApi'

interface FeedbackFormPanelProps {
  feedback: PendingFeedback
  onSubmitSuccess: () => void
}

type StarRatingRowProps = {
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
}

function StarRatingRow({ value, onChange, ariaLabel }: StarRatingRowProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const activeValue = hovered ?? value ?? 0

  const ratingLabels: Record<number, string> = {
    1: 'Rất tệ',
    2: 'Tệ',
    3: 'Bình thường',
    4: 'Tốt',
    5: 'Rất tốt',
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={ariaLabel}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((val) => {
          const isActive = val <= activeValue
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              onMouseEnter={() => setHovered(val)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(null)}
              className="group relative p-1 focus-visible:outline-none"
              aria-pressed={value === val}
              aria-label={`${val} sao - ${ratingLabels[val]}`}
            >
              <StarIcon
                className={cn(
                  'h-7 w-7 transition-all duration-200',
                  isActive
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-transparent text-muted-foreground/30 group-hover:text-amber-200'
                )}
              />
            </button>
          )
        })}
        <span className="ml-3 text-sm font-medium text-muted-foreground min-w-[90px]">
          {activeValue ? ratingLabels[activeValue] : 'Chưa đánh giá'}
        </span>
      </div>
    </div>
  )
}

const FeedbackFormPanel: React.FC<FeedbackFormPanelProps> = ({
  feedback,
  onSubmitSuccess,
}) => {
  const { data: questions = [] } = useGetQuestionsQuery()
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [comment, setComment] = useState('')
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation()

  const ratingQuestions = useMemo<FeedbackQuestion[]>(
    () =>
      questions
        .filter((q) => (q.questionType || '').toLowerCase() === 'rating')
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [questions]
  )

  const isFormValid = useMemo(
    () => ratingQuestions.length > 0 && ratingQuestions.every((q) => ratings[q.id] && ratings[q.id] > 0),
    [ratings, ratingQuestions]
  )

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error('Vui lòng đánh giá đầy đủ tất cả câu hỏi')
      return
    }

    try {
      await submitFeedback({
        feedbackId: feedback.feedbackId,
        payload: {
          responses: ratingQuestions.map((q) => ({
            questionId: q.id,
            rating: ratings[q.id],
          })),
          comment: comment?.trim() || undefined,
        },
      }).unwrap()
      toast.success('Đã gửi phản hồi thành công')
      setRatings({})
      setComment('')
      onSubmitSuccess()
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi phản hồi. Thử lại sau.'
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-sm px-2 font-medium">
                {feedback.classCode}
              </Badge>
              {feedback.phaseName && (
                <Badge variant="outline" className="rounded-sm px-2 font-normal">
                  {feedback.phaseName}
                </Badge>
              )}
            </div>
            <h2 className="text-lg lg:text-xl font-bold line-clamp-2">
              {feedback.courseName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {feedback.className}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
          {/* Rating Questions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Đánh giá của bạn
            </h3>

            <div className="space-y-5">
              {ratingQuestions.map((q, index) => (
                <div key={q.id} className="space-y-2.5">
                  <Label className="text-sm font-medium leading-relaxed block">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {q.questionText}
                  </Label>
                  <StarRatingRow
                    value={ratings[q.id] ?? 0}
                    onChange={(value) => setRatings((prev) => ({ ...prev, [q.id]: value }))}
                    ariaLabel={`Đánh giá câu ${index + 1}`}
                  />
                  {index < ratingQuestions.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Comment */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-semibold">
              Nhận xét thêm (không bắt buộc)
            </Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ điểm bạn hài lòng hoặc đề xuất cải thiện..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 lg:px-6 py-4 border-t bg-background shrink-0">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            'Đang gửi...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Gửi phản hồi
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default FeedbackFormPanel
