import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  Plus,
  Users,
  Calendar,
  MapPin,
  User,
  ChevronRight
} from 'lucide-react'
import { useGetClassesQuery } from '@/store/services/classApi'
import type { ClassListItemDTO, ClassListRequest, TeacherSummaryDTO } from '@/store/services/classApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useNavigate } from 'react-router-dom'

type FilterState = Omit<ClassListRequest, 'page' | 'size'>

export default function ClassListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    courseId: undefined,
    status: undefined,
    approvalStatus: undefined,
    modality: undefined,
    sort: 'startDate',
    sortDir: 'asc',
  })

  const [pagination, setPagination] = useState({
    page: 0, // Backend uses 0-based pagination
    size: 20, // Backend uses 'size' instead of 'limit'
  })

  const queryParams = useMemo(() => ({
    ...filters,
    ...pagination,
    courseId: filters.courseId || undefined,
    status: filters.status || undefined,
    approvalStatus: filters.approvalStatus || undefined,
    modality: filters.modality || undefined,
  }), [filters, pagination])

  const {
    data: response,
    isLoading,
    error
  } = useGetClassesQuery(queryParams)

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 0 })) // Reset to first page when filter changes (0-based)
  }

  const handleSearch = (value: string) => {
    handleFilterChange('search', value)
  }

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 80) return 'bg-green-100 text-green-800 border-green-200'
    if (percentage < 95) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'ONGOING':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderTeachers = (teachers: TeacherSummaryDTO[]) => {
    if (!teachers || teachers.length === 0) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Not assigned</span>
        </div>
      )
    }

    const displayTeachers = teachers.slice(0, 3)
    const remainingCount = teachers.length - 3

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                {displayTeachers.map((teacher) => (
                  <span key={teacher.id} className="text-sm">
                    {teacher.fullName}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    +{remainingCount} more...
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-2">All Teachers</p>
              {teachers.map((teacher) => (
                <div key={teacher.id} className="text-sm">
                  <div className="font-medium">{teacher.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {teacher.email} • {teacher.sessionCount} sessions
                  </div>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title="Class Management"
        description="Manage and view all classes in your branches"
      >
        <div className="rounded-lg border bg-card p-6">
          <div className="text-center text-destructive">
            <p>Failed to load classes. Please try again.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Class Management"
      description="Manage and view all classes in your branches"
    >
      <div className="flex flex-col gap-6">
        {/* Filters & Action */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Approval Status Filter */}
            <Select
              value={filters.approvalStatus || 'all'}
              onValueChange={(value) => handleFilterChange('approvalStatus', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Approvals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approvals</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Modality Filter */}
            <Select
              value={filters.modality || 'all'}
              onValueChange={(value) => handleFilterChange('modality', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Modalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="currentEnrolled">Students</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={filters.sortDir}
              onValueChange={(value) => handleFilterChange('sortDir', value)}
            >
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Class
          </Button>
        </div>

      {/* Class List */}
      <div>
        <div className="mb-4 text-sm text-muted-foreground">
          {response?.data ?
            `Showing ${response.data.content.length} of ${response.data.page.totalElements} classes` :
            'Loading classes...'
          }
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : response?.data?.content ? (
          <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response.data.content.map((classItem: ClassListItemDTO) => (
                    <TableRow
                      key={classItem.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/academic/classes/${classItem.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          <div className="text-sm text-muted-foreground">{classItem.code}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(classItem.startDate).toLocaleDateString()} - {new Date(classItem.plannedEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{classItem.courseName}</div>
                          <div className="text-sm text-muted-foreground">{classItem.courseCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderTeachers(classItem.teachers)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.branchName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className={getCapacityColor(classItem.currentEnrolled, classItem.maxCapacity)}
                          >
                            {classItem.currentEnrolled}/{classItem.maxCapacity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(classItem.status)}
                        >
                          {classItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {response?.data?.page && response.data.page.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {response.data.page.number + 1} of {response.data.page.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={response.data.page.number === 0}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={response.data.page.number >= response.data.page.totalPages - 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}