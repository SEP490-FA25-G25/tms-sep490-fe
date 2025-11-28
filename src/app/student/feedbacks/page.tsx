import React, { useEffect, useMemo, useState } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetPendingFeedbacksQuery,
  useSubmitFeedbackMutation,
  useGetQuestionsQuery,
  type PendingFeedback,
  type FeedbackQuestion,
} from '@/store/services/studentFeedbackApi'

export default function StudentPendingFeedbackPage() {
  const { data: pending = [], isLoading, isFetching, refetch } = useGetPendingFeedbacksQuery()
  const { data: questions = [], isLoading: isLoadingQuestions } = useGetQuestionsQuery()
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
                <h1 className="text-2xl font-semibold tracking-tight">Phản hồi khóa học</h1>
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
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-36 w-full" />
                </div>
              ) : pending.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
                  <MessageCircleIcon className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-lg font-semibold">Không có phản hồi cần hoàn thành</p>
                  <p className="text-sm text-muted-foreground">
                    Khi phase kết thúc, phản hồi mới sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pending.map((item) => (
                    <div
                      key={item.feedbackId}
                      className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/5 p-4 md:flex-row md:items-center md:justify-between"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={!!selected} onOpenChange={(open) => (!open ? setSelected(null) : null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Đánh giá phase</DialogTitle>
            {selected && (
              <DialogDescription className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {selected.classCode} · {selected.className}
                </p>
                <p>
                  {selected.courseName}
                  {selected.phaseName ? ` · ${selected.phaseName}` : ''}
                </p>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {ratingQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border border-border/70 bg-muted/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Label className="text-sm font-semibold leading-tight">{q.questionText}</Label>
                  <Badge variant="outline" className="text-xs">
                    Câu {q.id}
                  </Badge>
                </div>
                <RadioGroup
                  value={ratings[q.id]?.toString() ?? ''}
                  onValueChange={(value) => setRatings((prev) => ({ ...prev, [q.id]: Number(value) }))}
                  className="mt-3 flex flex-wrap gap-3"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <Label
                      key={val}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/80 px-3 py-2 text-sm hover:border-primary/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={val.toString()} />
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-amber-500" />
                        <span>{val}</span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="comment">Nhận xét thêm (không bắt buộc)</Label>
              <Textarea
                id="comment"
                placeholder="Chia sẻ điểm bạn hài lòng hoặc đề xuất cải thiện..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
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
