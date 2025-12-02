import { useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AlertCircle } from 'lucide-react'
import { useGetClassByIdQuery, useGetClassStudentsQuery } from '@/store/services/classApi'
import { useGetStudentDetailQuery } from '@/store/services/studentApi'
import type { CreateStudentResponse } from '@/store/services/studentApi'
import { EnrollmentImportDialog } from './EnrollmentImportDialog'
import { StudentSelectionDialog } from './StudentSelectionDialog'
import { CreateStudentDialog } from './CreateStudentDialog'
import { StudentCreatedSuccessDialog } from './StudentCreatedSuccessDialog'
import { AAClassDetailHeader } from './components/AAClassDetailHeader'
import { AAClassDetailHeaderSkeleton, AAClassDetailContentSkeleton } from './components/AAClassDetailSkeleton'
import { OverviewTab } from './components/OverviewTab'
import { StudentsTab } from './components/StudentsTab'
import { SessionsTab } from './components/SessionsTab'
import { StudentDetailDrawer } from '../../students/components/StudentDetailDrawer'
import { StudentEditDialog } from '../../students/components/StudentEditDialog'
import { toast } from 'sonner'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const classId = parseInt(id || '0')
  const [activeTab, setActiveTab] = useState('overview')
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)
  const [studentSelectionOpen, setStudentSelectionOpen] = useState(false)
  const [createStudentOpen, setCreateStudentOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [createdStudentData, setCreatedStudentData] = useState<CreateStudentResponse | null>(null)
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [studentEditDialogOpen, setStudentEditDialogOpen] = useState(false)

  const {
    data: classResponse,
    isLoading: isLoadingClass,
    error: classError
  } = useGetClassByIdQuery(classId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const classData = classResponse?.data

  const {
    data: studentsResponse,
    isLoading: isLoadingStudents
  } = useGetClassStudentsQuery(
    { classId, page: 0, size: 10 },
    { skip: !classData || classData.status === 'DRAFT' }
  )

  const students = studentsResponse?.data?.content || []
  const totalStudents = studentsResponse?.data?.page?.totalElements || students.length

  // Query student detail for drawer
  const { data: studentDetailResponse, isLoading: isLoadingStudentDetail } =
    useGetStudentDetailQuery(selectedStudentId!, {
      skip: !selectedStudentId,
    })

  const studentDetail = studentDetailResponse?.data

  // Pass studentDetail directly - drawer interface now matches API response
  const drawerStudent = studentDetail ?? null

  // Handler for opening student drawer
  const handleStudentClick = (studentId: number) => {
    setSelectedStudentId(studentId)
    setStudentDrawerOpen(true)
  }

  // Render header based on state
  const renderHeader = () => {
    if (isLoadingClass) {
      return <AAClassDetailHeaderSkeleton />
    }

    if (classError || !classData) {
      return (
        <div className="border-b bg-background">
          <div className="@container/main py-4">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Không thể tải thông tin lớp học</p>
                <Button size="sm" onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <AAClassDetailHeader
        classData={classData}
        onEnrollFromExisting={() => setStudentSelectionOpen(true)}
        onEnrollNewStudent={() => setCreateStudentOpen(true)}
        onEnrollFromExcel={() => setEnrollmentDialogOpen(true)}
      />
    )
  }

  return (
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            {renderHeader()}

            <main className="flex-1">
              <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 md:py-8">
                {isLoadingClass && <AAClassDetailContentSkeleton />}

                {!isLoadingClass && classError && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-base font-semibold text-foreground">Không thể tải thông tin lớp học</p>
                    <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
                    <Button size="sm" onClick={() => window.location.reload()}>
                      Thử lại
                    </Button>
                  </div>
                )}

                {!isLoadingClass && classData && (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                      <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
                        <TabsTrigger
                          value="overview"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                        >
                          Tổng quan
                        </TabsTrigger>
                        <TabsTrigger
                          value="students"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                        >
                          Học viên
                        </TabsTrigger>
                        <TabsTrigger
                          value="sessions"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                        >
                          Buổi học
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-6">
                      <OverviewTab classData={classData} />
                    </TabsContent>

                    <TabsContent value="students" className="space-y-6">
                      <StudentsTab
                        students={students}
                        isLoading={isLoadingStudents}
                        totalStudents={totalStudents}
                        onStudentClick={handleStudentClick}
                      />
                    </TabsContent>

                    <TabsContent value="sessions" className="space-y-6">
                      <SessionsTab classId={classId} />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarInset>

      {/* Enrollment Dialogs */}
      {classData && (
        <>
          <StudentSelectionDialog
            classId={classId}
            open={studentSelectionOpen}
            onOpenChange={setStudentSelectionOpen}
            onSuccess={() => {
              // API will auto-refresh via cache invalidation
            }}
          />

          <CreateStudentDialog
            classId={classId}
            branchId={classData.branch.id}
            open={createStudentOpen}
            onOpenChange={setCreateStudentOpen}
            onSuccess={(studentData) => {
              setCreatedStudentData(studentData)
              setSuccessDialogOpen(true)
            }}
          />

          <StudentCreatedSuccessDialog
            open={successDialogOpen}
            onOpenChange={setSuccessDialogOpen}
            studentData={createdStudentData}
            onEnrollNow={() => {
              toast.info('Tính năng ghi danh sẽ được triển khai sau')
            }}
            onAddLater={() => {
              toast.success('Học viên đã được tạo thành công')
            }}
          />

          <EnrollmentImportDialog
            classId={classId}
            open={enrollmentDialogOpen}
            onOpenChange={setEnrollmentDialogOpen}
            onSuccess={() => {
              // API will auto-refresh via cache invalidation
            }}
          />
        </>
      )}

      {/* Student Detail Drawer */}
      <StudentDetailDrawer
        open={studentDrawerOpen}
        onOpenChange={setStudentDrawerOpen}
        student={drawerStudent}
        isLoading={isLoadingStudentDetail}
        onEdit={() => {
          setStudentEditDialogOpen(true)
        }}
        hideEnrollButton={true}
      />

      {/* Student Edit Dialog */}
      <StudentEditDialog
        open={studentEditDialogOpen}
        onOpenChange={setStudentEditDialogOpen}
        student={drawerStudent}
        onSuccess={() => {
          // Refetch student detail after edit
          setStudentEditDialogOpen(false)
        }}
      />
    </SidebarProvider>
  )
}
