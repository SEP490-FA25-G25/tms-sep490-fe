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
  Search,
  Plus,
  Users,
  Calendar,
  MapPin,
  User,
  ChevronRight
} from 'lucide-react'
import { useGetClassesQuery } from '@/store/services/classApi'
import type { ClassListItemDTO, ClassListRequest } from '@/store/services/classApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useNavigate } from 'react-router-dom'

type FilterState = Omit<ClassListRequest, 'page' | 'size'>

export default function ClassListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    courseId: undefined,
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
            `Showing ${response.data.numberOfElements} of ${response.data.totalElements} classes` :
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
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.teacherName || 'Not assigned'}</span>
                        </div>
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
        {response?.data && response.data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {response.data.page + 1} of {response.data.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={response.data.first}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={response.data.last}
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