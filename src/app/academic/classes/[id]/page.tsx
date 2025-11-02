import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Calendar,
  MapPin,
  User,
  Clock,
  BookOpen,
  Building,
  FileUp,
  UserPlus,
  ChevronDown,
  ArrowLeft
} from 'lucide-react'
import { useGetClassByIdQuery, useGetClassStudentsQuery } from '@/store/services/classApi'
import type { ClassStudentDTO } from '@/store/services/classApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Link } from 'react-router-dom'
import { EnrollmentImportDialog } from './EnrollmentImportDialog'
import { StudentSelectionDialog } from './StudentSelectionDialog'
import { CreateStudentDialog } from './CreateStudentDialog'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const classId = parseInt(id || '0')
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)
  const [studentSelectionOpen, setStudentSelectionOpen] = useState(false)
  const [createStudentOpen, setCreateStudentOpen] = useState(false)

  const {
    data: classResponse,
    isLoading: isLoadingClass,
    error: classError
  } = useGetClassByIdQuery(classId)

  const {
    data: studentsResponse,
    isLoading: isLoadingStudents
  } = useGetClassStudentsQuery({ classId, page: 0, size: 10 })

  const classData = classResponse?.data
  const students = studentsResponse?.data?.content || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 80) return 'bg-green-100 text-green-800 border-green-200'
    if (percentage < 95) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (classError) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/academic/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load class details. Please try again.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoadingClass) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Class not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/academic/classes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
              <p className="text-muted-foreground">{classData.code}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Enroll Students
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setStudentSelectionOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Select from Available
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateStudentOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEnrollmentDialogOpen(true)}>
                <FileUp className="mr-2 h-4 w-4" />
                Import from Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={getStatusColor(classData.status)}>
            {classData.status}
          </Badge>
          <Badge variant="outline" className={getApprovalColor(classData.approvalStatus)}>
            {classData.approvalStatus}
          </Badge>
          <Badge variant="secondary">
            {classData.modality}
          </Badge>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Course Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Course
            </div>
            <div className="font-medium">{classData.course.name}</div>
            <div className="text-sm text-muted-foreground">{classData.course.code}</div>
          </div>

          {/* Branch Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              Branch
            </div>
            <div className="font-medium">{classData.branch.name}</div>
            <div className="text-sm text-muted-foreground">{classData.branch.address}</div>
          </div>

          {/* Teacher Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Teacher
            </div>
            <div className="font-medium">{classData.teacherName}</div>
          </div>

          {/* Room Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Room
            </div>
            <div className="font-medium">{classData.room}</div>
          </div>
        </div>

        {/* Schedule & Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {new Date(classData.startDate).toLocaleDateString()} - {new Date(classData.plannedEndDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">{classData.scheduleSummary}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enrollment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Enrolled</span>
                <span className="font-medium">{classData.enrollmentSummary.currentEnrolled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max Capacity</span>
                <span className="font-medium">{classData.enrollmentSummary.maxCapacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Slots</span>
                <span className="font-medium">{classData.enrollmentSummary.availableSlots}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Utilization Rate</span>
                <Badge variant="outline" className={getCapacityColor(classData.enrollmentSummary.currentEnrolled, classData.enrollmentSummary.maxCapacity)}>
                  {classData.enrollmentSummary.utilizationRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        {classData.upcomingSessions && classData.upcomingSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.upcomingSessions.slice(0, 6).map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{new Date(session.date).toLocaleDateString()}</div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    {session.startTime} - {session.endTime}
                  </div>
                  <div className="text-sm">{session.room}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Enrolled Students</h3>
            <Button variant="outline" size="sm">
              View All Students
            </Button>
          </div>

          {isLoadingStudents ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: ClassStudentDTO) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.fullName}</div>
                          <div className="text-sm text-muted-foreground">{student.studentCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.branchName}</TableCell>
                      <TableCell>{new Date(student.enrolledAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students enrolled yet.</p>
            </div>
          )}
        </div>

        {/* Enrollment Dialogs */}
        <StudentSelectionDialog
          classId={classId}
          open={studentSelectionOpen}
          onOpenChange={setStudentSelectionOpen}
          onSuccess={() => {
            window.location.reload()
          }}
        />

        <CreateStudentDialog
          open={createStudentOpen}
          onOpenChange={setCreateStudentOpen}
          onSuccess={() => {
            // After creating student, open student selection dialog
            setStudentSelectionOpen(true)
          }}
        />

        <EnrollmentImportDialog
          classId={classId}
          open={enrollmentDialogOpen}
          onOpenChange={setEnrollmentDialogOpen}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      </div>
    </DashboardLayout>
  )
}