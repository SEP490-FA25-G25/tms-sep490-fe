import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetStudentCoursesQuery } from '@/store/services/courseApi'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Monitor
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StudentCoursesPage() {
  const { user } = useAuth()
  const {
    data: courses,
    error,
    isLoading
  } = useGetStudentCoursesQuery(user?.id || 0)

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ENROLLED':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'DROPPED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ENROLLED':
        return 'Đang học'
      case 'COMPLETED':
        return 'Đã hoàn thành'
      case 'DROPPED':
        return 'Đã nghỉ'
      default:
        return status
    }
  }

  const getModalityBadge = (modality: string) => {
    switch (modality?.toUpperCase()) {
      case 'ONLINE':
        return <Badge variant="secondary" className="text-xs"><Monitor className="h-3 w-3 mr-1" />Online</Badge>
      case 'OFFLINE':
        return <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />Offline</Badge>
      case 'HYBRID':
        return <Badge variant="default" className="text-xs"><Users className="h-3 w-3 mr-1" />Hybrid</Badge>
      default:
        return null
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}`
  }

  if (isLoading) {
    return (
      <StudentRoute>
        <SidebarProvider
          style={{
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties}
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Đang tải khóa học...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </StudentRoute>
    )
  }

  if (error) {
    return (
      <StudentRoute>
        <SidebarProvider
          style={{
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties}
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-8 py-8">
                  <div className="px-8">
                    <Alert variant="destructive">
                      <AlertDescription>
                        Không thể tải khóa học. Vui lòng thử lại sau.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </StudentRoute>
    )
  }

  return (
    <StudentRoute>
      <SidebarProvider
        style={{
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              {/* Header Section */}
              <div className="px-8 py-6 border-b border-border">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold tracking-tight">Khóa Học Của Tôi</h1>
                  <p className="text-muted-foreground">
                    {courses?.length || 0} khóa học đang đăng ký
                  </p>
                </div>
              </div>

              {/* Courses Grid */}
              <div className="px-8 py-6">
                {courses && courses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <Card key={course.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg leading-tight truncate mb-1">
                                {course.name}
                              </CardTitle>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">
                                  {course.code}
                                </p>
                                {course.targetAudience && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    Đối tượng: <span className="font-medium text-foreground">{course.targetAudience}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Badge variant={getStatusBadgeVariant(course.enrollmentStatus)} className="shrink-0">
                                {getStatusText(course.enrollmentStatus)}
                              </Badge>
                              {getModalityBadge(course.modality || '')}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Progress */}
                          {course.progressPercentage !== undefined && (
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Tiến độ</span>
                                <span className="font-medium">{Math.round(course.progressPercentage)}%</span>
                              </div>
                              <Progress value={course.progressPercentage} className="h-2" />
                            </div>
                          )}

                          {/* Course Information */}
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Môn học</span>
                              <span className="font-medium text-right">{course.subjectName}</span>
                            </div>

                            {course.teacherName && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Giáo viên</span>
                                <span className="font-medium text-right">{course.teacherName}</span>
                              </div>
                            )}

                            {course.centerName && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Địa điểm</span>
                                <span className="font-medium text-right">{course.centerName}</span>
                              </div>
                            )}

                            {course.classStartDate && course.classEndDate && (
                              <div className="flex items-center justify-between">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-right">
                                  {formatDateRange(course.classStartDate, course.classEndDate)}
                                </span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Course Statistics */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {course.completedSessions !== undefined && course.totalSessions && (
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                <span className="text-muted-foreground text-xs">Buổi học</span>
                                <span className="font-semibold">
                                  {course.completedSessions}/{course.totalSessions}
                                </span>
                              </div>
                            )}
                            {course.sessionPerWeek && (
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                                <span className="font-semibold">{course.sessionPerWeek}/tuần</span>
                              </div>
                            )}
                            {course.durationWeeks && (
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                <span className="text-muted-foreground text-xs">Thời lượng</span>
                                <span className="font-semibold">{course.durationWeeks} tuần</span>
                              </div>
                            )}
                            {course.attendanceRate && (
                              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                <span className="text-muted-foreground text-xs">Điểm danh</span>
                                <span className="font-semibold">{course.attendanceRate}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <Link to={`/student/courses/${course.id}`}>
                            <Button className="w-full" size="sm" variant="outline">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Chưa có khóa học nào
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Bạn chưa đăng ký khóa học nào. Hãy liên hệ với phòng đào tạo để biết thông tin về các khóa học sắp tới.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  )
}
