import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
  FullScreenModalFooter,
} from '@/components/ui/full-screen-modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, UserPlus, Info } from 'lucide-react'
import { useGetAvailableStudentsQuery } from '@/store/services/classApi'
import { useEnrollExistingStudentsMutation } from '@/store/services/enrollmentApi'
import type { AvailableStudentDTO } from '@/store/services/classApi'
import { toast } from 'sonner'
import { ReplacementAssessmentsPopover } from '@/components/ReplacementAssessmentsPopover'

interface StudentSelectionDialogProps {
  classId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StudentSelectionDialog({
  classId,
  open,
  onOpenChange,
  onSuccess,
}: StudentSelectionDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(0)

  const {
    data: response,
    isLoading,
  } = useGetAvailableStudentsQuery({ classId, search, page, size: 20 })

  const [enrollStudents, { isLoading: isEnrolling }] = useEnrollExistingStudentsMutation()

  const students = response?.data?.content || []
  const pagination = response?.data

  const toggleStudent = (studentId: number) => {
    const newSet = new Set(selectedStudents)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setSelectedStudents(newSet)
  }

  const selectAll = () => {
    const newSet = new Set(selectedStudents)
    students.forEach(student => newSet.add(student.id))
    setSelectedStudents(newSet)
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const handleEnroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student')
      return
    }

    try {
      const result = await enrollStudents({
        classId,
        studentIds: Array.from(selectedStudents),
      }).unwrap()

      toast.success(
        `Successfully enrolled ${result.data.enrolledCount} students. Created ${result.data.totalStudentSessionsCreated} session records.`
      )
      
      // Show warnings if any
      if (result.data.warnings && result.data.warnings.length > 0) {
        result.data.warnings.forEach(warning => {
          toast.warning(warning)
        })
      }

      handleClose()
      onSuccess()
    } catch (error: unknown) {
      console.error('Enrollment error:', error)
      const err = error as { data?: { message?: string } }
      const errorMessage = err?.data?.message || 'Failed to enroll students'
      toast.error(errorMessage)
    }
  }

  const handleClose = () => {
    setSearch('')
    setSelectedStudents(new Set())
    setPage(0)
    onOpenChange(false)
  }

  const getMatchPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Perfect Match
          </Badge>
        )
      case 2:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Partial Match
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            No Match
          </Badge>
        )
    }
  }

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent>
        <FullScreenModalHeader>
          <FullScreenModalTitle>Select Students to Enroll</FullScreenModalTitle>
          <FullScreenModalDescription>
            Students are sorted by skill assessment match. Perfect matches appear first.
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody className="flex flex-col space-y-4 p-0">
          {/* Search & Actions */}
          <div className="flex items-center gap-3 px-6 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or student code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>

          {/* Selection Summary */}
          {selectedStudents.size > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mx-6">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Info className="h-4 w-4" />
                <span className="font-medium">{selectedStudents.size} students selected</span>
              </div>
            </div>
          )}

          {/* Students Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden px-6">
              <div className="flex-1 rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky top-0 bg-background"></TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">Match</TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">Student</TableHead>
                      <TableHead className="min-w-[250px] sticky top-0 bg-background">Email</TableHead>
                      <TableHead className="min-w-[150px] sticky top-0 bg-background">Phone</TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">Bài kiểm tra đánh giá</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: AvailableStudentDTO) => (
                      <TableRow
                        key={student.id}
                        className={selectedStudents.has(student.id) ? 'bg-blue-50' : undefined}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getMatchPriorityBadge(student.classMatchInfo?.matchPriority || student.matchPriority)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.fullName}</div>
                            <div className="text-sm text-muted-foreground">{student.studentCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                          <ReplacementAssessmentsPopover
                            assessments={student.replacementSkillAssessments || []}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {pagination.numberOfElements} of {pagination.totalElements} students
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.first}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page + 1} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.last}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available students found.</p>
              {search && <p className="text-sm mt-2">Try adjusting your search criteria.</p>}
            </div>
          )}
        </FullScreenModalBody>

        <FullScreenModalFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={selectedStudents.size === 0 || isEnrolling}
          >
            {isEnrolling ? 'Enrolling...' : `Enroll ${selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''} Students`}
          </Button>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  )
}
