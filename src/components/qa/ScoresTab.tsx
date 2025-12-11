"use client"

import { useState } from "react"
import { useGetQAClassScoresQuery } from "@/store/services/qaApi"
import type { StudentScoresSummary, AssessmentScore } from "@/types/qa"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle, Search, Users, Calendar, BookOpen, Clock, User, MessageSquare, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ASSESSMENT_KIND_STYLES, getStatusStyle } from "@/lib/status-colors"

interface ScoresTabProps {
  classId: number
}

export function ScoresTab({ classId }: ScoresTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentScoresSummary | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentScore | null>(null)

  const { data: scoresData, isLoading, error } = useGetQAClassScoresQuery(classId)

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-emerald-600 font-semibold"
    if (percentage >= 60) return "text-amber-600 font-medium"
    if (percentage >= 40) return "text-orange-600"
    return "text-rose-600"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải dữ liệu điểm. Vui lòng thử lại.
        </AlertDescription>
      </Alert>
    )
  }

  if (!scoresData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không có dữ liệu điểm cho lớp này.
        </AlertDescription>
      </Alert>
    )
  }

  const students = scoresData.students || []
  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase().trim()
    return !searchLower || 
      student.studentCode.toLowerCase().includes(searchLower) ||
      student.studentName.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.phone?.includes(searchLower)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,_2fr)_3fr] xl:grid-cols-[minmax(360px,_1fr)_2fr] h-[calc(100vh-280px)] overflow-hidden border rounded-lg">
      {/* Left Column - Students List */}
      <div className="border-r flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredStudents.length} học viên
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, mã, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Students List */}
        <ScrollArea className="h-full w-full">
          <div className="p-3 space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? "Không tìm thấy học viên" : "Chưa có học viên nào"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Card
                  key={student.studentId}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:bg-muted/50",
                    selectedStudent?.studentId === student.studentId
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:shadow-sm"
                  )}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={student.avatarUrl || ''} alt={student.studentName} />
                      <AvatarFallback>
                        {student.studentName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.studentCode}
                      </p>
                      {student.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {student.email}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Student Scores Detail */}
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {selectedStudent ? (
          <>
            {/* Scores Content */}
            <ScrollArea className="flex-1">
              <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Điểm thành phần
                  </h3>

                  {selectedStudent.scores.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Bài kiểm tra</TableHead>
                              <TableHead>Loại</TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Ngày</span>
                                </div>
                              </TableHead>
                              <TableHead className="hidden md:table-cell">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Thời lượng</span>
                                </div>
                              </TableHead>
                              <TableHead className="text-center">Điểm</TableHead>
                              <TableHead className="hidden lg:table-cell">Chấm bởi</TableHead>
                              <TableHead className="hidden lg:table-cell">Ngày chấm</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {selectedStudent.scores.map((score) => (
                            <TableRow 
                              key={score.assessmentId}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedAssessment(score)}
                            >
                              <TableCell>
                                <p className="font-medium text-sm line-clamp-2">{score.assessmentName}</p>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    'text-xs',
                                    getStatusStyle(ASSESSMENT_KIND_STYLES, score.assessmentKind)
                                  )}
                                >
                                  {score.assessmentKind}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm whitespace-nowrap">
                                  {formatDate(score.scheduledDate)}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {score.durationMinutes ? (
                                  <span className="text-sm text-muted-foreground">
                                    {score.durationMinutes} phút
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.score != null ? (
                                  <span className={cn(getScoreColor(score.score, score.maxScore))}>
                                    {score.score}/{score.maxScore}
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Chưa chấm
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {score.gradedByName ? (
                                  <span className="text-sm">{score.gradedByName}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {score.gradedAt ? (
                                  <span className="text-sm">{formatDate(score.gradedAt)}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/30">
                      <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                      Chưa có bài kiểm tra nào
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Chọn học viên để xem điểm
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Nhấn vào học viên ở danh sách bên trái
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assessment Detail Dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={(open) => !open && setSelectedAssessment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Chi tiết bài kiểm tra
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="space-y-4">
              {/* Assessment Info */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{selectedAssessment.assessmentName}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Loại:</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs',
                        getStatusStyle(ASSESSMENT_KIND_STYLES, selectedAssessment.assessmentKind)
                      )}
                    >
                      {selectedAssessment.assessmentKind}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ngày:</span>
                    <span>{formatDate(selectedAssessment.scheduledDate)}</span>
                  </div>
                  {selectedAssessment.durationMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Thời lượng:</span>
                      <span>{selectedAssessment.durationMinutes} phút</span>
                    </div>
                  )}
                  {selectedAssessment.skill && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Kỹ năng:</span>
                      <span>{selectedAssessment.skill}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Section */}
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium mb-3">Kết quả</h5>
                {selectedAssessment.score != null ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Điểm số</span>
                      <div className="text-right">
                        <span className={cn(
                          'text-lg font-bold',
                          getScoreColor(selectedAssessment.score, selectedAssessment.maxScore)
                        )}>
                          {selectedAssessment.score}/{selectedAssessment.maxScore}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({((selectedAssessment.score / selectedAssessment.maxScore) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {selectedAssessment.feedback && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Nhận xét từ giáo viên
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                          {selectedAssessment.feedback}
                        </p>
                      </div>
                    )}

                    {selectedAssessment.gradedByName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Chấm bởi: <span className="font-medium text-foreground">{selectedAssessment.gradedByName}</span></span>
                        {selectedAssessment.gradedAt && (
                          <>
                            <span>•</span>
                            <span>{formatDate(selectedAssessment.gradedAt)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    <Badge variant="outline" className="text-xs">
                      Chưa chấm điểm
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
