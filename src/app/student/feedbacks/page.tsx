import type { CSSProperties } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { MessageCircleIcon, RotateCcw, Search, Star } from 'lucide-react'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import {
  useGetStudentFeedbacksQuery,
  type StudentFeedbackItem,
} from '@/store/services/studentFeedbackApi'
import { useGetMyClassesQuery } from '@/store/services/studentClassApi'
import { Combobox } from '@/components/ui/combobox'
import FeedbackFormPanel from './components/FeedbackFormPanel'
import FeedbackDetailPanel from './components/FeedbackDetailPanel'

type TabValue = 'PENDING' | 'SUBMITTED'

export default function StudentPendingFeedbackPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>()
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | undefined>()
  const [selectedFeedback, setSelectedFeedback] = useState<StudentFeedbackItem | null>(null)

  // Fetch student's own classes for filter (no need to pass studentId)
  const { data: classesData } = useGetMyClassesQuery({
    enrollmentStatus: ['ENROLLED', 'COMPLETED'],
    size: 100
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: feedbacks = [], isLoading, refetch } = useGetStudentFeedbacksQuery({
    status: activeTab,
    classId: selectedClassId ? parseInt(selectedClassId) : undefined,
    phaseId: selectedPhaseId ? parseInt(selectedPhaseId) : undefined,
    search: debouncedSearch || undefined,
  })

  // Reset selection and phase filter when tab or class changes
  useEffect(() => {
    setSelectedFeedback(null)
    setSelectedPhaseId(undefined)
  }, [activeTab, selectedClassId])

  // Auto-select first feedback when data loads
  useEffect(() => {
    if (feedbacks.length > 0 && !selectedFeedback) {
      setSelectedFeedback(feedbacks[0])
    }
  }, [feedbacks, selectedFeedback])

  // Update selected feedback when list changes (after submit)
  useEffect(() => {
    if (selectedFeedback && feedbacks.length > 0) {
      const stillExists = feedbacks.find(f => f.feedbackId === selectedFeedback.feedbackId)
      if (!stillExists) {
        setSelectedFeedback(feedbacks[0] || null)
      }
    } else if (feedbacks.length === 0) {
      setSelectedFeedback(null)
    }
  }, [feedbacks, selectedFeedback])

  const pendingCount = useMemo(() => {
    return feedbacks.filter(f => !f.isFeedback).length
  }, [feedbacks])

  // Get unique phases from feedbacks for the selected class
  const availablePhases = useMemo(() => {
    if (!selectedClassId) return []
    const classIdNum = parseInt(selectedClassId)
    const phases = new Map<number, string>()
    feedbacks.forEach(f => {
      if (f.classId === classIdNum && f.phaseId && f.phaseName) {
        phases.set(f.phaseId, f.phaseName)
      }
    })
    return Array.from(phases, ([id, name]) => ({ value: id.toString(), label: name }))
  }, [feedbacks, selectedClassId])

  // Prepare class options for combobox
  const classOptions = useMemo(() => {
    if (!classesData?.data?.content) return []
    return classesData.data.content.map(c => ({
      value: c.classId.toString(),
      label: `${c.classCode} - ${c.className}`
    }))
  }, [classesData])

  const formatDate = (value?: string) => {
    if (!value) return '—'
    try {
      return format(parseISO(value), "dd/MM/yyyy", { locale: vi })
    } catch {
      return value
    }
  }

  const handleSubmitSuccess = () => {
    refetch()
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedClassId(undefined)
    setSelectedPhaseId(undefined)
  }

  const activeFilterCount = [selectedClassId, selectedPhaseId, searchQuery].filter(Boolean).length

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="@container/main flex flex-1 flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <header className="flex flex-col gap-4 border-b border-border px-4 sm:px-6 py-5">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Phản hồi khóa học</h1>
                  <p className="text-sm text-muted-foreground">
                    Đánh giá và xem lịch sử phản hồi các phase học tập
                  </p>
                </div>

                {/* Tabs + Filters */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                    <TabsList>
                      <TabsTrigger value="PENDING" className="gap-1.5">
                        Cần nộp
                        {pendingCount > 0 && activeTab !== 'PENDING' && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                            {pendingCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="SUBMITTED" className="gap-1.5">
                        Lịch sử
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Class Filter */}
                    <Combobox
                      options={classOptions}
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                      placeholder="Tất cả lớp"
                      searchPlaceholder="Tìm lớp..."
                      emptyText="Không tìm thấy lớp"
                      className="h-9 w-[180px]"
                    />

                    {/* Phase Filter - Only show when class is selected */}
                    {selectedClassId && availablePhases.length > 0 && (
                      <Combobox
                        options={availablePhases}
                        value={selectedPhaseId}
                        onValueChange={setSelectedPhaseId}
                        placeholder="Tất cả phase"
                        searchPlaceholder="Tìm phase..."
                        emptyText="Không tìm thấy phase"
                        className="h-9 w-[160px]"
                      />
                    )}

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 w-[160px]"
                      />
                    </div>

                    {/* Reset Filters Button */}
                    {activeFilterCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={handleResetFilters}
                      >
                        <RotateCcw />
                      </Button>
                    )}
                  </div>
                </div>
              </header>

              {/* Main Content - 2 Columns Layout */}
              <main className="flex-1 min-h-0 overflow-hidden">
                {isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isLoading && feedbacks.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,2fr)_3fr] xl:grid-cols-[minmax(360px,1fr)_2fr] h-full overflow-hidden">
                    {/* Left Column - Feedback List */}
                    <div className="border-r border-border flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
                      <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
                        <p className="text-sm font-medium text-muted-foreground">
                          {feedbacks.length} phản hồi {activeTab === 'PENDING' ? 'cần hoàn thành' : 'đã nộp'}
                        </p>
                      </div>
                      <ScrollArea className="h-full w-full">
                        <div className="p-3 space-y-2">
                          {feedbacks.map((item) => (
                            <Card
                              key={item.feedbackId}
                              className={cn(
                                "p-3 cursor-pointer transition-all hover:bg-muted/50",
                                selectedFeedback?.feedbackId === item.feedbackId
                                  ? "ring-2 ring-primary bg-primary/5"
                                  : "hover:shadow-sm"
                              )}
                              onClick={() => setSelectedFeedback(item)}
                            >
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                        {item.classCode}
                                      </Badge>
                                      {item.phaseName && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                          {item.phaseName}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">
                                      {item.courseName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.className}
                                    </p>
                                  </div>

                                  {/* Rating badge for submitted */}
                                  {item.isFeedback && item.averageRating != null && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                      <span className="text-sm font-medium">
                                        {item.averageRating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                  <span>
                                    {item.isFeedback
                                      ? `Nộp: ${formatDate(item.submittedAt)}`
                                      : `Tạo: ${formatDate(item.createdAt)}`
                                    }
                                  </span>
                                  <span className="tabular-nums">#{item.feedbackId}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Right Column - Form/Detail Panel */}
                    <div className="flex flex-col min-h-0 overflow-hidden bg-muted/10 min-w-0">
                      {selectedFeedback ? (
                        activeTab === 'PENDING' && !selectedFeedback.isFeedback ? (
                          <FeedbackFormPanel
                            key={selectedFeedback.feedbackId}
                            feedback={{
                              feedbackId: selectedFeedback.feedbackId,
                              classId: selectedFeedback.classId,
                              classCode: selectedFeedback.classCode,
                              className: selectedFeedback.className,
                              courseName: selectedFeedback.courseName,
                              phaseId: selectedFeedback.phaseId,
                              phaseName: selectedFeedback.phaseName,
                              createdAt: selectedFeedback.createdAt,
                            }}
                            onSubmitSuccess={handleSubmitSuccess}
                          />
                        ) : (
                          <FeedbackDetailPanel
                            key={selectedFeedback.feedbackId}
                            feedback={selectedFeedback}
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <MessageCircleIcon className="h-10 w-10" />
                              </EmptyMedia>
                              <EmptyTitle>Chọn một phản hồi</EmptyTitle>
                              <EmptyDescription>
                                {activeTab === 'PENDING'
                                  ? 'Chọn một phản hồi từ danh sách bên trái để đánh giá'
                                  : 'Chọn một phản hồi từ danh sách bên trái để xem chi tiết'
                                }
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isLoading && feedbacks.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageCircleIcon className="h-10 w-10" />
                        </EmptyMedia>
                        <EmptyTitle>
                          {searchQuery
                            ? 'Không tìm thấy kết quả'
                            : activeTab === 'PENDING'
                              ? 'Không có phản hồi cần hoàn thành'
                              : 'Chưa có lịch sử phản hồi'
                          }
                        </EmptyTitle>
                        <EmptyDescription>
                          {searchQuery
                            ? 'Thử thay đổi từ khóa tìm kiếm'
                            : activeTab === 'PENDING'
                              ? 'Khi phase kết thúc, phản hồi mới sẽ xuất hiện tại đây.'
                              : 'Các phản hồi bạn đã nộp sẽ hiển thị tại đây.'
                          }
                        </EmptyDescription>
                      </EmptyHeader>
                      {searchQuery && (
                        <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Xóa tìm kiếm
                        </Button>
                      )}
                    </Empty>
                  </div>
                )}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  )
}
