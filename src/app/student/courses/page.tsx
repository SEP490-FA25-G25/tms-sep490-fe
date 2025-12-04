import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetStudentCoursesQuery } from '@/store/services/courseApi'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  ExternalLink,
  Loader2
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
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="px-4 lg:px-6">
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
              <header className="flex flex-col gap-1 border-b border-border px-4 lg:px-6 py-5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Khóa học của tôi</h1>
                <p className="text-sm text-muted-foreground">
                  {courses?.length || 0} khóa học đang đăng ký
                </p>
              </header>

              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  {courses && courses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {course.name}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                  {course.code}
                                </p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(course.enrollmentStatus)}>
                                {getStatusText(course.enrollmentStatus)}
                              </Badge>
                            </div>

                            {/* Progress */}
                            {course.progressPercentage !== undefined && (
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Tiến độ</span>
                                  <span className="font-medium">{Math.round(course.progressPercentage)}%</span>
                                </div>
                                <Progress value={course.progressPercentage} className="h-2" />
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Course Metadata */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{course.subjectName}</span>
                                {course.levelName && (
                                  <span className="text-gray-500">• {course.levelName}</span>
                                )}
                              </div>

                              {course.teacherName && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">{course.teacherName}</span>
                                </div>
                              )}

                              {course.centerName && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">{course.centerName}</span>
                                  {course.roomName && (
                                    <span className="text-gray-500">• {course.roomName}</span>
                                  )}
                                </div>
                              )}

                              {course.classStartDate && course.classEndDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {new Date(course.classStartDate).toLocaleDateString('vi-VN')} - {new Date(course.classEndDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              )}

                              {course.totalHours && course.sessionPerWeek && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {course.totalHours}h • {course.sessionPerWeek} buổi/tuần
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Statistics */}
                            {course.completedSessions !== undefined && (course.numberOfSessions || course.totalSessions) && (
                              <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                                <span className="text-gray-600">
                                  {course.completedSessions}/{course.numberOfSessions || course.totalSessions} buổi học
                                </span>
                                <span className="font-medium text-gray-900">
                                  {course.attendanceRate}
                                </span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Link to={`/student/courses/${course.id}`}>
                                <Button className="flex-1" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Xem chi tiết
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Chưa có khóa học nào
                        </h3>
                        <p className="text-gray-600">
                          Bạn chưa đăng ký khóa học nào. Hãy liên hệ với phòng đào tạo để biết thông tin về các khóa học sắp tới.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  )
}