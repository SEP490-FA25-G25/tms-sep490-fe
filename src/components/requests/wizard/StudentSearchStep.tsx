import React, { useState } from 'react'
import { useSearchStudentsQuery } from '@/store/services/studentRequestApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Phone, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import TransferErrorDisplay from '../TransferErrorDisplay'
import type { StudentSearchResult } from '@/types/academicTransfer'

interface StudentSearchStepProps {
  selectedStudent: StudentSearchResult | null
  onSelectStudent: (student: StudentSearchResult) => void
}

export default function StudentSearchStep({
  selectedStudent,
  onSelectStudent,
}: StudentSearchStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useSearchStudentsQuery(
    {
      search: debouncedSearchTerm,
      status: 'ACTIVE',
      page: 0,
      size: 10,
    },
    {
      skip: !debouncedSearchTerm || debouncedSearchTerm.trim().length < 2,
    }
  )

  const students = searchResults?.data?.content || []
  const totalElements = searchResults?.data?.totalElements || 0

  const handleSelectStudent = (student: StudentSearchResult) => {
    onSelectStudent(student)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">Tìm kiếm học viên</h3>
          <p className="text-sm text-muted-foreground">
            Nhập mã học viên, tên, email hoặc số điện thoại để tìm kiếm
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <TransferErrorDisplay
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span>Đang tìm kiếm học viên...</span>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && !error && debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2 && students.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Tìm thấy {totalElements} học viên
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50",
                  selectedStudent?.id === student.id && "border-primary bg-primary/5"
                )}
                onClick={() => handleSelectStudent(student)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Student Header */}
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {student.fullName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Mã học viên: {student.studentCode}
                        </div>
                      </div>
                      {student.id === selectedStudent?.id && (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Đã chọn
                        </Badge>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{student.phone}</span>
                      </div>
                    </div>

                    {/* Student Details */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{student.branchName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Đang học:</span>
                        <Badge className={getStatusColor('active')}>
                          {student.activeEnrollments} lớp
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <Button
                      size="sm"
                      variant={selectedStudent?.id === student.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectStudent(student)
                      }}
                    >
                      {selectedStudent?.id === student.id ? "Đã chọn" : "Chọn"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2 && students.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Không tìm thấy học viên phù hợp</p>
          <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-2">
            Xóa tìm kiếm
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!debouncedSearchTerm && (
        <div className="text-center py-12">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Nhập thông tin tìm kiếm để bắt đầu</p>
            <div className="text-xs">
              <p>Bạn có thể tìm kiếm theo:</p>
              <ul className="list-disc list-inside text-left mt-1 space-y-1">
                <li>Mã học viên</li>
                <li>Tên đầy đủ</li>
                <li>Email</li>
                <li>Số điện thoại</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}