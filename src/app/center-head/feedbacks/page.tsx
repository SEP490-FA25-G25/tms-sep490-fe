"use client"

import type { CSSProperties } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Loader2,
  MessageCircleIcon,
  RotateCcw,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import {
  useGetQAClassesQuery,
  useGetClassFeedbacksQuery,
  useGetPhasesByCourseIdQuery,
} from '@/store/services/qaApi'
import { useGetCoursesQuery } from '@/store/services/classCreationApi'
import type { StudentFeedbackListResponse } from '@/types/qa'
import QAFeedbackDetailPanel from '@/app/qa/student-feedback/components/QAFeedbackDetailPanel'
import { useAuth } from '@/hooks/useAuth'

type FeedbackItem = StudentFeedbackListResponse['feedbacks'][number]

export default function CenterHeadFeedbacksPage() {
  const { selectedBranchId } = useAuth()
  
  // Filter states - Hierarchy: Subject → Class → Phase (No Branch filter for Center Head)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Combobox states
  const [subjectComboboxOpen, setSubjectComboboxOpen] = useState(false)
  const [classComboboxOpen, setClassComboboxOpen] = useState(false)

  // Selected feedback for detail panel
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch subjects
  const { data: subjectsResponse, isLoading: subjectsLoading } = useGetCoursesQuery()
  const subjects = subjectsResponse?.data || []

  // Fetch classes - filter by selected branch and subject
  const { data: classesData, isLoading: classesLoading } = useGetQAClassesQuery({
    branchIds: selectedBranchId ? [selectedBranchId] : undefined,
    page: 0,
    size: 1000, // Get all classes for center head
    sort: 'startDate',
    sortDir: 'desc',
  })

  // Filter classes by selected subject
  const filteredClasses = useMemo(() => {
    if (!classesData?.data) return []
    if (!selectedSubjectId) return classesData.data
    return classesData.data.filter(c => c.subjectId === selectedSubjectId)
  }, [classesData, selectedSubjectId])

  // Selected class info
  const selectedClass = filteredClasses.find((c) => c.classId === selectedClassId)

  // Fetch phases for the selected class's subject
  const { data: phases = [] } = useGetPhasesByCourseIdQuery(
    selectedClass?.subjectId ?? skipToken
  )

  // Fetch feedbacks for selected class
  const {
    data: feedbackData,
    isLoading: feedbackLoading,
  } = useGetClassFeedbacksQuery(
    selectedClassId
      ? {
        classId: selectedClassId,
        filters: {
          phaseId: selectedPhase !== 'all' ? parseInt(selectedPhase) : undefined,
          isFeedback: selectedStatus === 'all' ? undefined : selectedStatus === 'submitted',
        },
      }
      : skipToken
  )

  // Filter feedbacks by search
  const filteredFeedbacks = useMemo(() => {
    if (!feedbackData?.feedbacks) return []

    const searchLower = debouncedSearch.toLowerCase().trim()
    if (!searchLower) return feedbackData.feedbacks

    return feedbackData.feedbacks.filter((feedback) =>
      feedback.studentName?.toLowerCase().includes(searchLower)
    )
  }, [feedbackData?.feedbacks, debouncedSearch])

  // Statistics
  const statistics = feedbackData?.statistics

  // Auto-select first feedback when data loads
  useEffect(() => {
    if (filteredFeedbacks.length > 0 && !selectedFeedback) {
      setSelectedFeedback(filteredFeedbacks[0])
    }
  }, [filteredFeedbacks, selectedFeedback])

  // Update selected feedback when list changes
  useEffect(() => {
    if (selectedFeedback && filteredFeedbacks.length > 0) {
      const stillExists = filteredFeedbacks.find(
        (f) => f.feedbackId === selectedFeedback.feedbackId
      )
      if (!stillExists) {
        setSelectedFeedback(filteredFeedbacks[0])
      }
    } else if (filteredFeedbacks.length === 0) {
      setSelectedFeedback(null)
    }
  }, [filteredFeedbacks, selectedFeedback])

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    setSelectedClassId(null)
  }, [selectedSubjectId, selectedBranchId])

  useEffect(() => {
    setSelectedPhase('all')
    setSelectedStatus('all')
    setSearchQuery('')
    setSelectedFeedback(null)
  }, [selectedClassId])

  // Handlers
  const handleSubjectSelect = (subjectId: number | null) => {
    setSelectedSubjectId(subjectId)
    setSubjectComboboxOpen(false)
  }

  const handleClassSelect = (classId: number | null) => {
    setSelectedClassId(classId)
    setClassComboboxOpen(false)
  }

  const handleResetFilters = () => {
    setSelectedPhase('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  const handleResetAll = () => {
    setSelectedSubjectId(null)
    setSelectedClassId(null)
    setSelectedPhase('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  return (
    <ProtectedRoute requiredRoles={['CENTER_HEAD']}>
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
              <header className="flex justify-between gap-3 border-b border-border px-4 lg:px-6 py-5">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Phản hồi học viên
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Xem và phân tích phản hồi của học viên theo môn học và lớp học
                  </p>
                </div>

                {/* Filter Hierarchy: Subject → Class (No Branch filter) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Subject Filter */}
                  <Popover open={subjectComboboxOpen} onOpenChange={setSubjectComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={subjectComboboxOpen}
                        className="h-9 w-[200px] justify-between font-normal"
                        disabled={subjectsLoading}
                      >
                        {subjectsLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </span>
                        ) : selectedSubjectId ? (
                          <span className="truncate">
                            {subjects.find(s => s.id === selectedSubjectId)?.name || 'Môn học'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Tất cả môn học</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm môn học..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy môn học.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => handleSubjectSelect(null)}>
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedSubjectId === null ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              Tất cả môn học
                            </CommandItem>
                            {subjects.map((subject) => (
                              <CommandItem
                                key={subject.id}
                                value={`${subject.code} ${subject.name}`}
                                onSelect={() => handleSubjectSelect(subject.id)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedSubjectId === subject.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{subject.code}</span>
                                  <span className="text-xs text-muted-foreground">{subject.name}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Class Filter */}
                  <Popover open={classComboboxOpen} onOpenChange={setClassComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={classComboboxOpen}
                        className="h-9 w-[280px] justify-between font-normal"
                        disabled={classesLoading}
                      >
                        {classesLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </span>
                        ) : selectedClass ? (
                          <span className="truncate">
                            <span className="font-medium">{selectedClass.classCode}</span>
                            <span className="text-muted-foreground ml-2">
                              - {selectedClass.className}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Chọn lớp học...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm lớp học..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy lớp học.</CommandEmpty>
                          <CommandGroup>
                            {filteredClasses.map((classItem) => (
                              <CommandItem
                                key={classItem.classId}
                                value={`${classItem.classCode} ${classItem.className} ${classItem.subjectName}`}
                                onSelect={() => handleClassSelect(classItem.classId)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedClassId === classItem.classId
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{classItem.classCode}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {classItem.className} • {classItem.subjectName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Reset All Button */}
                  {(selectedSubjectId || selectedClassId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={handleResetAll}
                    >
                      <RotateCcw />
                    </Button>
                  )}
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 min-h-0 overflow-hidden">
                {/* Search & Filters - Only when class is selected */}
                {selectedClassId && (
                  <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-4 border-b bg-background">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên học viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 w-full"
                      />
                    </div>

                    {/* Filters */}
                    <div className="ml-auto flex items-center gap-2">
                      {/* Phase Filter */}
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                        <SelectTrigger className="h-9 w-auto min-w-[160px]">
                          <SelectValue placeholder="Giai đoạn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                          {[...phases]
                            .sort((a, b) => a.phaseNumber - b.phaseNumber)
                            .map((phase) => (
                              <SelectItem key={phase.id} value={phase.id.toString()}>
                                {phase.name || `Phase ${phase.phaseNumber}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* Status Filter */}
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9 w-auto min-w-[150px]">
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="submitted">Đã nộp</SelectItem>
                          <SelectItem value="not_submitted">Chưa nộp</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Reset Filter Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={handleResetFilters}
                        disabled={
                          !searchQuery && selectedPhase === 'all' && selectedStatus === 'all'
                        }
                        title="Xóa bộ lọc"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* No class selected */}
                {!selectedClassId && (
                  <div className="flex items-center justify-center h-full">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageCircleIcon className="h-10 w-10" />
                        </EmptyMedia>
                        <EmptyTitle>Chọn lớp học để xem phản hồi</EmptyTitle>
                        <EmptyDescription>
                          {filteredClasses.length > 0
                            ? 'Vui lòng chọn một lớp học từ danh sách'
                            : 'Không có lớp học nào. Hãy thử thay đổi bộ lọc môn học'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                )}

                {/* Loading */}
                {selectedClassId && feedbackLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Content with feedback */}
                {selectedClassId && !feedbackLoading && feedbackData && (
                  <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Statistics Bar */}
                    {statistics && (
                      <div className="border-b bg-muted/30 px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="font-semibold">{statistics.totalStudents}</span>{' '}
                              <span className="text-muted-foreground">học viên</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm">
                              <span className="font-semibold text-emerald-600">
                                {statistics.submittedCount}
                              </span>{' '}
                              <span className="text-muted-foreground">đã nộp</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="font-semibold">
                                {statistics.submissionRate.toFixed(1)}%
                              </span>{' '}
                              <span className="text-muted-foreground">tỷ lệ</span>
                            </span>
                            <Progress
                              value={statistics.submissionRate}
                              className="w-20 h-1.5"
                            />
                          </div>
                          {statistics.averageRating != null && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm">
                                <span className="font-semibold">
                                  {statistics.averageRating.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">/5</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Two-column layout */}
                    {filteredFeedbacks.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,2fr)_3fr] xl:grid-cols-[minmax(360px,1fr)_2fr] h-full min-h-0 overflow-hidden">
                        {/* Left Column - Feedback List */}
                        <div className="border-r border-border flex flex-col min-h-0 h-full overflow-hidden">
                          <ScrollArea className="h-full w-full">
                            <div className="p-3 space-y-2">
                              {filteredFeedbacks.map((item) => (
                                <Card
                                  key={item.feedbackId}
                                  className={cn(
                                    'p-3 cursor-pointer transition-all hover:bg-muted/50',
                                    selectedFeedback?.feedbackId === item.feedbackId
                                      ? 'ring-2 ring-primary bg-primary/5'
                                      : 'hover:shadow-sm'
                                  )}
                                  onClick={() => setSelectedFeedback(item)}
                                >
                                  <div className="space-y-2">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                          {item.phaseName && (
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] px-1.5 py-0.5"
                                            >
                                              {item.phaseName}
                                            </Badge>
                                          )}
                                          <Badge
                                            variant={item.isFeedback ? 'default' : 'secondary'}
                                            className={cn(
                                              'text-[10px] px-1.5 py-0.5',
                                              item.isFeedback
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                : ''
                                            )}
                                          >
                                            {item.isFeedback ? 'Đã nộp' : 'Chưa nộp'}
                                          </Badge>
                                        </div>
                                        <p className="font-semibold text-sm leading-tight">
                                          {item.studentName}
                                        </p>
                                        {item.responsePreview && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {item.responsePreview}
                                          </p>
                                        )}
                                      </div>

                                      {/* Rating badge */}
                                      {item.isFeedback && item.rating != null && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                          <span className="text-sm font-medium">
                                            {item.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer */}
                                    {item.submittedAt && (
                                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                        Nộp:{' '}
                                        {new Date(item.submittedAt).toLocaleDateString('vi-VN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Right Column - Detail Panel */}
                        <div className="flex flex-col min-h-0 overflow-hidden bg-muted/10 min-w-0">
                          {selectedFeedback ? (
                            <QAFeedbackDetailPanel
                              key={selectedFeedback.feedbackId}
                              feedback={selectedFeedback}
                              classCode={selectedClass?.classCode || ''}
                              className={selectedClass?.className || ''}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Empty>
                                <EmptyHeader>
                                  <EmptyMedia variant="icon">
                                    <MessageCircleIcon className="h-10 w-10" />
                                  </EmptyMedia>
                                  <EmptyTitle>Chọn một phản hồi</EmptyTitle>
                                  <EmptyDescription>
                                    Chọn một phản hồi từ danh sách bên trái để xem chi tiết
                                  </EmptyDescription>
                                </EmptyHeader>
                              </Empty>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center flex-1">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <MessageCircleIcon className="h-10 w-10" />
                            </EmptyMedia>
                            <EmptyTitle>
                              {debouncedSearch
                                ? 'Không tìm thấy kết quả'
                                : 'Chưa có phản hồi'}
                            </EmptyTitle>
                            <EmptyDescription>
                              {debouncedSearch
                                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                                : 'Chưa có phản hồi nào cho lớp học này'}
                            </EmptyDescription>
                          </EmptyHeader>
                          {(debouncedSearch ||
                            selectedPhase !== 'all' ||
                            selectedStatus !== 'all') && (
                              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Xóa bộ lọc
                              </Button>
                            )}
                        </Empty>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
