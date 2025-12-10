import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchStudentsQuery, type StudentSearchResult } from "@/store/services/studentRequestApi"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useAuth } from "@/hooks/useAuth"

interface StepConfig {
  id: number
  title: string
  description: string
  isComplete: boolean
  isAvailable: boolean
}

interface SelectStudentStepProps {
  onSelect: (student: StudentSearchResult) => void
  onCancel: () => void
  steps?: StepConfig[]
  currentStep?: number
}

export function SelectStudentStep({
  onSelect,
  onCancel,
  steps,
  currentStep = 1,
}: SelectStudentStepProps) {
  const { selectedBranchId } = useAuth()
  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | undefined>()

  const {
    data: studentsResponse,
    isLoading,
    error,
    refetch,
  } = useSearchStudentsQuery(
    { 
      search: searchKeyword.trim() || " ", // Backend requires at least some search term
      size: 100, 
      page: 0,
      branchIds: selectedBranchId ? [selectedBranchId] : undefined
    },
    {
      skip: false, // Always fetch to show full list
    }
  )

  const students = studentsResponse?.data?.content ?? []

  const filteredStudents = students.filter((student) => {
    if (!searchKeyword.trim()) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      student.fullName?.toLowerCase().includes(keyword) ||
      student.email?.toLowerCase().includes(keyword) ||
      student.studentCode?.toLowerCase().includes(keyword)
    )
  })

  const handleContinue = () => {
    if (selectedStudent) {
      onSelect(selectedStudent)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {steps && steps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isActive = currentStep === stepNumber
              const isCompleted = step.isComplete || currentStep > stepNumber

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {stepNumber}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-1 text-center",
                        isActive
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-colors",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-1 min-h-[450px] space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm học viên theo tên, email, mã học viên..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Students List */}
      <div className="rounded-lg border overflow-hidden bg-card h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <Empty className="border border-destructive/40 text-destructive">
              <EmptyHeader>
                <EmptyTitle>Không thể tải danh sách học viên</EmptyTitle>
                <EmptyDescription>
                  Vui lòng kiểm tra kết nối và thử lại.
                </EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => refetch()}>
                Thử tải lại
              </Button>
            </Empty>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {searchKeyword
              ? "Không tìm thấy học viên phù hợp với từ khóa tìm kiếm."
              : "Không có học viên nào trong chi nhánh."}
          </div>
        ) : (
          <div className="divide-y">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={cn(
                  "p-4 transition-colors cursor-pointer hover:bg-muted/50",
                  selectedStudent?.id === student.id &&
                    "bg-primary/5 border-l-4 border-l-primary"
                )}
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{student.fullName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {student.email}
                      {student.studentCode && (
                        <span className="ml-2">· {student.studentCode}</span>
                      )}
                    </div>
                    {student.activeEnrollments !== undefined && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {student.branchName} · {student.activeEnrollments} lớp đang học
                      </div>
                    )}
                  </div>
                  {selectedStudent?.id === student.id && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button onClick={handleContinue} disabled={!selectedStudent}>
          Tiếp tục
        </Button>
      </div>
      </div>
    </div>
  )
}

