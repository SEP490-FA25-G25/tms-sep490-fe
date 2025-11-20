import { useParams } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentRoute } from '@/components/ProtectedRoute'
import { useGetCourseDetailQuery, useGetStudentCourseProgressQuery, useGetCourseMaterialsQuery } from '@/store/services/courseApi'
import { useAuth } from '@/contexts/AuthContext'
import { CourseHeader } from '@/components/course/CourseHeader'
import { TableOfContents } from '@/components/course/TableOfContents'
import { CourseOverview } from '@/components/course/CourseOverview'
import { SyllabusViewer } from '@/components/course/SyllabusViewer'
import { MaterialsLibrary } from '@/components/course/MaterialsLibrary'
import { LearningOutcomes } from '@/components/course/LearningOutcomes'
import { AssessmentTracker } from '@/components/course/AssessmentTracker'
import { ProgressDashboard } from '@/components/course/ProgressDashboard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, BookOpen, FileText, Target, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'

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

  const [activeSection, setActiveSection] = useState('overview')

  // Scroll to section when hash changes
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setActiveSection(hash)
    }
  }, [])

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
            <div className="flex flex-1 flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Đang tải thông tin khóa học...</p>
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
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="px-4 lg:px-6">
                    <Alert variant="destructive">
                      <AlertDescription>
                        Không thể tải thông tin khóa học. Vui lòng thử lại sau.
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

  const sections = [
    { id: 'overview', label: 'Tổng quan', icon: BookOpen },
    { id: 'syllabus', label: 'Đề cương chi tiết', icon: FileText },
    { id: 'materials', label: 'Tài liệu học tập', icon: BookOpen },
    { id: 'outcomes', label: 'Kết quả học tập', icon: Target },
    { id: 'progress', label: 'Tiến độ', icon: BarChart3 },
  ]

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
              {/* Course Header */}
              <CourseHeader
                course={courseDetail}
                progress={progress}
                materials={materials}
              />

              {/* Content Sections */}
              <div className="flex flex-1 gap-8 px-4 lg:px-6">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="max-w-4xl">
                    {/* Overview Section */}
                    <section id="overview" className="py-8 scroll-mt-20">
                      <CourseOverview course={courseDetail} />
                    </section>

                    {/* Syllabus Section */}
                    {courseDetail.phases && courseDetail.phases.length > 0 && (
                      <section id="syllabus" className="py-8 scroll-mt-20 border-t">
                        <SyllabusViewer phases={courseDetail.phases} />
                      </section>
                    )}

                    {/* Materials Section */}
                    {materials && (
                      <section id="materials" className="py-8 scroll-mt-20 border-t">
                        <MaterialsLibrary
                          courseId={courseId}
                          materials={materials}
                        />
                      </section>
                    )}

                    {/* Learning Outcomes Section */}
                    {courseDetail.clos && courseDetail.clos.length > 0 && (
                      <section id="outcomes" className="py-8 scroll-mt-20 border-t">
                        <LearningOutcomes
                          clos={courseDetail.clos}
                          progress={progress?.cloProgress}
                        />
                      </section>
                    )}

                    {/* Progress Section */}
                    {progress && (
                      <section id="progress" className="py-8 scroll-mt-20 border-t">
                        <ProgressDashboard progress={progress} />
                      </section>
                    )}

                    {/* Assessments Section */}
                    {courseDetail.assessments && courseDetail.assessments.length > 0 && (
                      <section className="py-8 scroll-mt-20 border-t">
                        <AssessmentTracker
                          assessments={courseDetail.assessments}
                          assessmentProgress={progress?.assessmentProgress}
                        />
                      </section>
                    )}
                  </div>
                </div>

                {/* Sticky Table of Contents - Right Side */}
                <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
                  <div className="sticky top-24">
                    <TableOfContents
                      sections={sections}
                      activeSection={activeSection}
                      onSectionChange={setActiveSection}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  )
}