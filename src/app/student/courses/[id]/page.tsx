import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  useGetCourseDetailQuery,
  useGetCourseMaterialsQuery,
  useGetStudentCourseProgressQuery
} from '@/store/services/courseApi'
import { StudentRoute } from '@/components/ProtectedRoute'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { CourseHeader } from '@/components/course/CourseHeader'
import { LearningOutcomes } from '@/components/course/LearningOutcomes'
import { ProgressDashboard } from '@/components/course/ProgressDashboard'
import { EnhancedSyllabusViewer } from '@/components/course/EnhancedSyllabusViewer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const courseId = parseInt(id || '0')

  // Course data queries
  const {
    data: courseDetail,
    error: courseError,
    isLoading: courseLoading
  } = useGetCourseDetailQuery(courseId)

  const {
    data: materials
  } = useGetCourseMaterialsQuery({
    courseId,
    studentId: user?.id
  })

  const {
    data: progress
  } = useGetStudentCourseProgressQuery({
    studentId: user?.id || 0,
    courseId
  })

  if (courseLoading) {
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
              <div className="flex-1 space-y-6 p-6 md:p-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </StudentRoute>
    )
  }

  if (courseError || !courseDetail) {
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
              <div className="flex-1 flex-col gap-8 p-6 md:p-8">
                <Alert variant="destructive">
                  <AlertDescription>
                    Không thể tải thông tin khóa học. Vui lòng thử lại sau.
                  </AlertDescription>
                </Alert>
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
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Content Sections */}
            <ScrollArea className="flex-1">
              {/* Course Header - Now inside scroll area */}
              <CourseHeader
                course={courseDetail}
                progress={progress}
                materials={materials}
              />
              
              <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                <Tabs defaultValue="syllabus" className="w-full">
                  <div className="border-b pb-px mb-6">
                    <TabsList className="h-auto p-0 bg-transparent space-x-6">
                      <TabsTrigger
                        value="syllabus"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                      >
                        Đề cương
                      </TabsTrigger>
                      <TabsTrigger
                        value="outcomes"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                      >
                        Mục tiêu
                      </TabsTrigger>
                      <TabsTrigger
                        value="progress"
                        className="rounded-none border-b-2 border-transparent px-2 py-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                      >
                        Tiến độ
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="min-h-[400px]">
                    <TabsContent value="syllabus" className="mt-0">
                      {courseDetail.phases && courseDetail.phases.length > 0 ? (
                        <EnhancedSyllabusViewer
                          phases={courseDetail.phases}
                          materials={materials}
                          assessments={courseDetail.assessments}
                        />
                      ) : (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <h3 className="text-lg font-semibold mb-2">Chưa có đề cương chi tiết</h3>
                            <p className="text-muted-foreground">Nội dung khóa học sẽ được cập nhật sớm</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="outcomes" className="mt-0">
                      {courseDetail.clos && courseDetail.clos.length > 0 ? (
                        <LearningOutcomes
                          clos={courseDetail.clos}
                          progress={progress?.cloProgress}
                        />
                      ) : (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <h3 className="text-lg font-semibold mb-2">Chưa có thông tin kết quả học tập</h3>
                            <p className="text-muted-foreground">Mục tiêu học tập sẽ được cập nhật sớm</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="progress" className="mt-0">
                      {progress ? (
                        <ProgressDashboard
                          progress={progress}
                        />
                      ) : (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <h3 className="text-lg font-semibold mb-2">Chưa có dữ liệu tiến độ học tập</h3>
                            <p className="text-muted-foreground">Tiến độ học tập sẽ được cập nhật khi bạn bắt đầu học</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  )
}