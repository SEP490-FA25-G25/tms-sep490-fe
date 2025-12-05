
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  AAKPISummary, 
  AAPendingRequestsTable, 
  AAQuickActionsPanel, 
  type AAKPIData,
  type PendingRequestItem,
  type RequestType as DashboardRequestType,
} from '@/components/academic/dashboard'
import { AAClassPerformanceList, type ClassPerformanceItem } from '@/components/academic/dashboard/AAClassPerformanceList'
import { RequestDetailDialog } from '@/app/academic/student-requests/components/RequestDetailDialog'
import { useGetPendingRequestsQuery } from '@/store/services/studentRequestApi'
import { useGetStaffRequestsQuery } from '@/store/services/teacherRequestApi'
import { useGetClassesQuery } from '@/store/services/classApi'
import { useGetStudentsQuery } from '@/store/services/studentApi'
import { useGetQAClassesQuery } from '@/store/services/qaApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, Eye, UserCog, CalendarClock, Monitor } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Teacher request type config
const teacherRequestTypeConfig = {
  REPLACEMENT: {
    label: "GV thay thế",
    icon: UserCog,
    badgeClassName: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  },
  RESCHEDULE: {
    label: "Đổi lịch",
    icon: CalendarClock,
    badgeClassName: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
  },
  MODALITY_CHANGE: {
    label: "Đổi hình thức",
    icon: Monitor,
    badgeClassName: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
  }
} as const

export function AcademicStaffDashboardContent() {
  const navigate = useNavigate()

  // Fetch pending student requests from API
  const { 
    data: pendingRequestsResponse, 
    isLoading: isLoadingStudentRequests,
    isFetching: isFetchingStudentRequests,
  } = useGetPendingRequestsQuery({ 
    page: 0, 
    size: 5, // Only show top 5 on dashboard
    sort: 'submittedAt,desc',
  })

  // Fetch pending teacher requests from API
  const {
    data: teacherRequestsResponse,
    isLoading: isLoadingTeacherRequests,
    isFetching: isFetchingTeacherRequests,
  } = useGetStaffRequestsQuery({ status: 'PENDING' })

  // Fetch classes count
  const {
    data: classesResponse,
    isLoading: isLoadingClasses,
  } = useGetClassesQuery({ page: 0, size: 1 })

  // Fetch students count
  const {
    data: studentsResponse,
    isLoading: isLoadingStudents,
  } = useGetStudentsQuery({ page: 0, size: 1 })

  // Fetch QA classes for performance monitoring
  const {
    data: qaClassesResponse,
    isLoading: isLoadingQAClasses,
  } = useGetQAClassesQuery({ page: 0, size: 50 }) // Get more classes to filter

  // Transform student requests to dashboard format
  const pendingStudentRequests: PendingRequestItem[] = useMemo(() => {
    if (!pendingRequestsResponse?.data?.content) return []
    
    return pendingRequestsResponse.data.content.map((request) => {
      const typeMap: Record<string, DashboardRequestType> = {
        'ABSENCE': 'ABSENCE',
        'MAKEUP': 'MAKEUP', 
        'TRANSFER': 'TRANSFER',
      }
      
      const daysUntil = request.daysUntilSession ?? request.additionalInfo?.daysUntilSession
      const isUrgent = daysUntil !== undefined && daysUntil !== null && daysUntil <= 2 && daysUntil >= 0
      
      return {
        id: request.id,
        type: typeMap[request.requestType] || 'ABSENCE',
        requesterName: request.student.fullName,
        requesterRole: 'STUDENT' as const,
        className: request.currentClass?.code || 'N/A',
        createdAt: request.submittedAt,
        isUrgent,
        summary: request.requestReason,
      }
    })
  }, [pendingRequestsResponse])

  // Get pending teacher requests (top 5)
  const pendingTeacherRequests = useMemo(() => {
    if (!teacherRequestsResponse?.data) return []
    return teacherRequestsResponse.data.slice(0, 5)
  }, [teacherRequestsResponse])

  // KPI data
  const kpiData: AAKPIData = useMemo(() => {
    return {
      todaySessions: { total: 0, needsSubstitute: 0 }, // TODO: Add API for today sessions
      newConsultations: { total: 0, unprocessed: 0 }, // TODO: Add API for consultations
      totalClasses: classesResponse?.data?.page?.totalElements ?? 0,
      totalStudents: studentsResponse?.data?.page?.totalElements ?? 0,
    }
  }, [classesResponse, studentsResponse])

  // Transform QA classes for performance list
  const classPerformanceItems: ClassPerformanceItem[] = useMemo(() => {
    if (!qaClassesResponse?.data) return []
    
    return qaClassesResponse.data.map((c) => ({
      classId: c.classId,
      classCode: c.classCode,
      className: c.className,
      courseName: c.courseName,
      attendanceRate: c.attendanceRate ?? 100,
      homeworkCompletionRate: c.homeworkCompletionRate ?? 100,
      totalSessions: c.totalSessions ?? 0,
      completedSessions: c.completedSessions ?? 0,
    }))
  }, [qaClassesResponse])

  // State for request detail modal
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  // Handler để mở modal chi tiết student request
  const handleViewStudentRequest = (request: PendingRequestItem) => {
    setSelectedRequestId(request.id)
  }

  const isLoadingKPI = isLoadingClasses || isLoadingStudents
  const isLoadingStudentRequestsTable = isLoadingStudentRequests || isFetchingStudentRequests
  const isLoadingTeacherRequestsTable = isLoadingTeacherRequests || isFetchingTeacherRequests

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <AAKPISummary 
        data={kpiData} 
        isLoading={isLoadingKPI}
      />

      {/* Row 2: Student Requests + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AAPendingRequestsTable 
            requests={pendingStudentRequests}
            isLoading={isLoadingStudentRequestsTable}
            onViewAll={() => navigate('/academic/student-requests')}
            onViewRequest={handleViewStudentRequest}
          />
        </div>
        <div className="lg:col-span-1">
          <AAQuickActionsPanel 
            onEnrollStudent={() => navigate('/academic/students')}
            onScheduleMakeup={() => navigate('/academic/student-requests?type=MAKEUP')}
            onProcessConsultation={() => navigate('/academic/consultation-registrations')}
            onViewReports={() => navigate('/academic/classes')}
          />
        </div>
      </div>

      {/* Row 3: Teacher Requests + Classes Performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Yêu cầu giáo viên chờ xử lý</CardTitle>
                <CardDescription>
                  {pendingTeacherRequests.length} yêu cầu đang chờ duyệt
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-sm"
                onClick={() => navigate('/academic/teacher-requests')}
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTeacherRequestsTable ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingTeacherRequests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Không có yêu cầu nào đang chờ xử lý
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-1">
                    {pendingTeacherRequests.map((request) => {
                      const config = teacherRequestTypeConfig[request.requestType as keyof typeof teacherRequestTypeConfig]
                      const Icon = config?.icon || UserCog
                      
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                              <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs font-medium", config?.badgeClassName)}
                                >
                                  {config?.label || request.requestType}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm text-foreground truncate">
                                {request.teacherName || 'Giáo viên'} • {request.classCode || request.className}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {request.reason || request.requestReason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(request.submittedAt), { 
                                addSuffix: false, 
                                locale: vi 
                              })}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => navigate(`/academic/teacher-requests`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <AAClassPerformanceList 
            classes={classPerformanceItems}
            isLoading={isLoadingQAClasses}
            onViewAll={() => navigate('/academic/classes')}
            onViewClass={(classId) => navigate(`/academic/classes/${classId}`)}
          />
        </div>
      </div>

      {/* Request Detail Dialog */}
      <RequestDetailDialog 
        requestId={selectedRequestId}
        open={selectedRequestId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequestId(null)
        }}
      />
    </div>
  )
}
