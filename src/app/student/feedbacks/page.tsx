import React, { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { MessageCircleIcon, RefreshCcwIcon, StarIcon } from 'lucide-react'
import { toast } from 'sonner'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import {
  useGetPendingFeedbacksQuery,
  useSubmitFeedbackMutation,
  useGetQuestionsQuery,
  type PendingFeedback,
  type FeedbackQuestion,
} from '@/store/services/studentFeedbackApi'

export default function StudentPendingFeedbackPage() {
  const { data: pending = [], isLoading, isFetching, refetch } = useGetPendingFeedbacksQuery()
  const { data: questions = [] } = useGetQuestionsQuery()
  const [selected, setSelected] = useState<PendingFeedback | null>(null)
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

  const handleOpenModal = (feedback: PendingFeedback) => {
    setSelected(feedback)
    setRatings({})
    setComment('')
  }

  const handleSubmit = async () => {
    if (!selected) return
    if (!isFormValid) {
      toast.error('Vui lòng đánh giá đầy đủ tất cả câu hỏi')
      return
    }

    try {
      await submitFeedback({
        feedbackId: selected.feedbackId,
        payload: {
          responses: ratingQuestions.map((q) => ({
            questionId: q.id,
            rating: ratings[q.id],
          })),
          comment: comment?.trim() || undefined,
        },
      }).unwrap()
      toast.success('Đã gửi phản hồi')
      setSelected(null)
      refetch()
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi phản hồi. Thử lại sau.'
      toast.error(message)
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return '—'
    try {
      return format(parseISO(value), "HH:mm dd/MM/yyyy", { locale: vi })
    } catch {
      return value
    }
  }

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Phản hồi khóa học</h1>
                <p className="text-sm text-muted-foreground">
                  Danh sách phản hồi sau phase bạn cần hoàn thành
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCcwIcon className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex flex-1 flex-col gap-4 px-6 py-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pending.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageCircleIcon className="h-10 w-10" />
                    </EmptyMedia>
                    <EmptyTitle>Không có phản hồi cần hoàn thành</EmptyTitle>
                    <EmptyDescription>
                      Khi phase kết thúc, phản hồi mới sẽ xuất hiện tại đây.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3">
                  {pending.map((item) => (
                    <Card
                      key={item.feedbackId}
                      className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between transition-shadow hover:shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{item.classCode}</Badge>
                          {item.phaseName && <Badge variant="outline">{item.phaseName}</Badge>}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.className} · {item.courseName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tạo lúc: {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Feedback #{item.feedbackId}</span>
                        <Button size="sm" onClick={() => handleOpenModal(item)}>
                          Đánh giá
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={!!selected} onOpenChange={(open) => (!open ? setSelected(null) : null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đánh giá phase</DialogTitle>
            {selected && (
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2 mb-2 pt-2">
                    <Badge variant="secondary" className="rounded-sm px-2 font-normal">
                      {selected.classCode}
                    </Badge>
                    {selected.phaseName && (
                      <Badge variant="outline" className="rounded-sm px-2 font-normal">
                        {selected.phaseName}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground text-base">{selected.courseName}</p>
                    <p>{selected.className}</p>
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6 px-1">
            {ratingQuestions.map((q, index) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <Label className="text-base font-medium leading-relaxed">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {q.questionText}
                  </Label>
                </div>
                <StarRatingRow
                  value={ratings[q.id] ?? 0}
                  onChange={(value) => setRatings((prev) => ({ ...prev, [q.id]: value }))}
                  ariaLabel={`Đánh giá câu ${index + 1}`}
                />
                {index < ratingQuestions.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            <Separator className="my-6" />

            <div className="space-y-3">
              <Label htmlFor="comment" className="text-base font-medium">
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

          <Separator />

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Để sau
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentRoute>
  )
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
                  'h-8 w-8 transition-all duration-200',
                  isActive
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-transparent text-muted-foreground/30 group-hover:text-amber-200'
                )}
              />
            </button>
          )
        })}
        <span className="ml-3 text-sm font-medium text-muted-foreground min-w-[100px]">
          {activeValue ? ratingLabels[activeValue] : 'Chưa đánh giá'}
        </span>
      </div>
    </div>
  )
}
