import { useState, useRef } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Info,
  Users,
  ArrowRight,
  AlertTriangle,
  Settings,
  UserCheck,
} from 'lucide-react'
import {
  usePreviewClassEnrollmentImportMutation,
  useExecuteClassEnrollmentImportMutation,
  useDownloadEnrollmentTemplateQuery,
  useDownloadClassEnrollmentTemplateQuery,
  type ClassEnrollmentImportPreview,
  type EnrollmentStrategy,
  type StudentEnrollmentData,
} from '@/store/services/enrollmentApi'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface EnrollmentImportDialogProps {
  classId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EnrollmentImportDialog({
  classId,
  open,
  onOpenChange,
  onSuccess,
}: EnrollmentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ClassEnrollmentImportPreview | null>(null)
  // Strategy: ALL = tất cả, PARTIAL = chọn thủ công
  const [baseStrategy, setBaseStrategy] = useState<'ALL' | 'PARTIAL'>('ALL')
  // Override capacity checkbox (có thể kết hợp với cả ALL và PARTIAL)
  const [overrideCapacity, setOverrideCapacity] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewMutation, { isLoading: isPreviewing }] = usePreviewClassEnrollmentImportMutation()
  const [executeMutation, { isLoading: isExecuting }] = useExecuteClassEnrollmentImportMutation()

  const genericTemplateQuery = useDownloadEnrollmentTemplateQuery()
  const classTemplateQuery = useDownloadClassEnrollmentTemplateQuery({ classId }, { skip: !open })

  // Compute derived values - all students sorted: valid first, then errors
  const allStudentsSorted = preview?.students ? [
    ...preview.students.filter(s => s.status !== 'ERROR' && s.status !== 'DUPLICATE'),
    ...preview.students.filter(s => s.status === 'ERROR' || s.status === 'DUPLICATE')
  ] : []
  
  const validStudentsList = preview?.students.filter(s => s.status !== 'ERROR' && s.status !== 'DUPLICATE') || []
  const errorStudentsList = preview?.students.filter(s => s.status === 'ERROR' || s.status === 'DUPLICATE') || []
  
  // Check if capacity will be exceeded
  const studentsToEnrollCount = baseStrategy === 'PARTIAL' ? selectedStudents.size : validStudentsList.length
  const willExceedCapacity = preview ? (preview.currentEnrolled + studentsToEnrollCount) > preview.maxCapacity : false

  // Helper to check if a student is valid (can be enrolled)
  const isStudentValid = (student: StudentEnrollmentData) => {
    return student.status === 'FOUND' || student.status === 'CREATE'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Kích thước tệp phải nhỏ hơn 10MB')
      return
    }
    setFile(selectedFile)
    setPreview(null)
    setBaseStrategy('ALL')
    setOverrideCapacity(false)
    setSelectedStudents(new Set())

    // Auto preview
    previewFile(selectedFile)
  }

  const previewFile = async (fileToPreview: File) => {
    try {
      const result = await previewMutation({ classId, file: fileToPreview }).unwrap()
      setPreview(result.data)

      // Auto-select strategy based on recommendation
      const recType = result.data.recommendation.type
      if (recType === 'OK') {
        setBaseStrategy('ALL')
        setOverrideCapacity(false)
      } else if (recType === 'PARTIAL_SUGGESTED') {
        setBaseStrategy('PARTIAL')
        setOverrideCapacity(false)
      } else if (recType === 'OVERRIDE_AVAILABLE') {
        setBaseStrategy('ALL')
        setOverrideCapacity(true)
      } else if (recType === 'BLOCKED') {
        setBaseStrategy('PARTIAL')
        setOverrideCapacity(false)
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Xem trước dữ liệu thất bại'
      toast.error(errorMessage)
      setFile(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      processFile(droppedFile)
    } else {
      toast.error('Vui lòng chỉ tải lên file Excel (.xlsx)')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDownloadTemplate = (type: 'generic' | 'class') => {
    try {
      const result = type === 'generic' ? genericTemplateQuery.data : classTemplateQuery.data
      if (!result) return

      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'generic' ? 'mau-danh-sach-sinh-vien.xlsx' : `lop-${classId}-mau-danh-sach.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Không thể tải xuống mẫu')
    }
  }

  const handleExecute = async () => {
    if (!preview) return

    if (validStudentsList.length === 0) {
      toast.error('Không có sinh viên hợp lệ để đăng ký')
      return
    }

    if (baseStrategy === 'PARTIAL' && selectedStudents.size === 0) {
      toast.error('Vui lòng chọn ít nhất một sinh viên')
      return
    }

    // Determine final strategy for backend
    const finalStrategy: EnrollmentStrategy = overrideCapacity ? 'OVERRIDE' : baseStrategy

    if (finalStrategy === 'OVERRIDE' && overrideReason.trim().length < 20) {
      toast.error('Lý do vượt sĩ số phải có ít nhất 20 ký tự')
      return
    }

    try {
      const studentsToEnroll = baseStrategy === 'PARTIAL'
        ? preview.students.filter((student, idx) => {
          if (student.status === 'ERROR' || student.status === 'DUPLICATE') return false
          const studentId = student.status === 'FOUND' ? student.resolvedStudentId : -idx - 1
          return selectedStudents.has(studentId!)
        })
        : preview.students.filter(student => student.status !== 'ERROR' && student.status !== 'DUPLICATE')

      const result = await executeMutation({
        classId: preview.classId,
        strategy: finalStrategy,
        selectedStudentIds: baseStrategy === 'PARTIAL' ? Array.from(selectedStudents) : undefined,
        overrideReason: overrideCapacity ? overrideReason : undefined,
        students: studentsToEnroll,
      }).unwrap()

      toast.success(
        `Đã đăng ký thành công ${result.data.successfulEnrollments} sinh viên`
      )
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || 'Thực hiện đăng ký thất bại')
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setBaseStrategy('ALL')
    setOverrideCapacity(false)
    setOverrideReason('')
    setSelectedStudents(new Set())
    onOpenChange(false)
  }

  const toggleStudentSelection = (student: StudentEnrollmentData, idx: number) => {
    // Don't allow selecting invalid students
    if (!isStudentValid(student)) return

    const newSet = new Set(selectedStudents)
    const studentId = student.status === 'FOUND' ? student.resolvedStudentId : -idx - 1

    if (newSet.has(studentId!)) {
      newSet.delete(studentId!)
    } else {
      newSet.add(studentId!)
    }
    setSelectedStudents(newSet)
  }

  const toggleAllSelection = () => {
    if (!preview) return
    const allSelected = validStudentsList.every((s) => {
      const realIdx = preview.students.indexOf(s)
      const id = s.status === 'FOUND' ? s.resolvedStudentId : -realIdx - 1
      return selectedStudents.has(id!)
    })

    const newSet = new Set(selectedStudents)
    validStudentsList.forEach((s) => {
      const realIdx = preview.students.indexOf(s)
      const id = s.status === 'FOUND' ? s.resolvedStudentId : -realIdx - 1
      if (allSelected) {
        newSet.delete(id!)
      } else {
        newSet.add(id!)
      }
    })
    setSelectedStudents(newSet)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isAllSelected = validStudentsList.length > 0 && validStudentsList.every((s) => {
    if (!preview) return false
    const id = s.status === 'FOUND' ? s.resolvedStudentId : -preview.students.indexOf(s) - 1
    return selectedStudents.has(id!)
  })

  // Check if can proceed
  const canProceed = preview && validStudentsList.length > 0 && 
    (baseStrategy === 'ALL' || selectedStudents.size > 0) &&
    (!willExceedCapacity || overrideCapacity)

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent size="2xl" className="bg-muted/10 p-0 gap-0">
        <FullScreenModalHeader className="bg-background border-b px-6 py-4">
          <FullScreenModalTitle className="text-xl font-semibold tracking-tight">
            Nhập sinh viên qua Excel
          </FullScreenModalTitle>
          <FullScreenModalDescription>
            Tải lên danh sách sinh viên để đăng ký hàng loạt vào lớp học.
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody className="p-0 flex flex-col h-full overflow-hidden bg-background">
          {!preview ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in-50">
              <div
                className={cn(
                  "w-full max-w-xl border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center transition-colors cursor-pointer relative overflow-hidden",
                  isPreviewing ? "bg-muted/10 pointer-events-none" : "hover:bg-muted/5"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !isPreviewing && fileInputRef.current?.click()}
              >
                {isPreviewing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Đang xử lý...</p>
                  </div>
                )}

                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Kéo thả file Excel vào đây</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Hoặc click để chọn file từ máy tính của bạn
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isPreviewing}
                />
                <Button variant="outline" className="pointer-events-none">
                  Chọn file
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleDownloadTemplate('generic')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-green-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Mẫu cơ bản</p>
                      <p className="text-xs text-muted-foreground">Tải xuống mẫu Excel chuẩn</p>
                    </div>
                    <Download className="h-4 w-4 ml-auto text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleDownloadTemplate('class')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Mẫu theo lớp</p>
                      <p className="text-xs text-muted-foreground">Bao gồm thông tin lớp học</p>
                    </div>
                    <Download className="h-4 w-4 ml-auto text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Summary Header */}
              <div className="bg-background border-b p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <FileSpreadsheet className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{file?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {preview.students.length} sinh viên • 
                        <span className="text-emerald-600 font-medium"> {validStudentsList.length} hợp lệ</span>
                        {errorStudentsList.length > 0 && (
                          <span className="text-rose-600 font-medium"> • {errorStudentsList.length} không hợp lệ</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hủy bỏ
                  </Button>
                </div>

                {/* Warning banner if there are errors */}
                {errorStudentsList.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Có {errorStudentsList.length} sinh viên không thể đăng ký
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Những sinh viên bị lỗi hoặc đã đăng ký lớp này sẽ được hiển thị mờ trong danh sách bên dưới.
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendation message */}
                {preview.recommendation && (
                  <div className={cn(
                    "p-3 rounded-lg flex items-start gap-3",
                    preview.recommendation.type === 'OK' && "bg-emerald-50 border border-emerald-200",
                    preview.recommendation.type === 'PARTIAL_SUGGESTED' && "bg-sky-50 border border-sky-200",
                    preview.recommendation.type === 'OVERRIDE_AVAILABLE' && "bg-amber-50 border border-amber-200",
                    preview.recommendation.type === 'BLOCKED' && "bg-rose-50 border border-rose-200"
                  )}>
                    <Info className={cn(
                      "h-5 w-5 shrink-0 mt-0.5",
                      preview.recommendation.type === 'OK' && "text-emerald-600",
                      preview.recommendation.type === 'PARTIAL_SUGGESTED' && "text-sky-600",
                      preview.recommendation.type === 'OVERRIDE_AVAILABLE' && "text-amber-600",
                      preview.recommendation.type === 'BLOCKED' && "text-rose-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        preview.recommendation.type === 'OK' && "text-emerald-800",
                        preview.recommendation.type === 'PARTIAL_SUGGESTED' && "text-sky-800",
                        preview.recommendation.type === 'OVERRIDE_AVAILABLE' && "text-amber-800",
                        preview.recommendation.type === 'BLOCKED' && "text-rose-800"
                      )}>
                        {preview.recommendation.type === 'OK' && 'Đủ sức chứa'}
                        {preview.recommendation.type === 'PARTIAL_SUGGESTED' && 'Khuyến nghị chọn một phần'}
                        {preview.recommendation.type === 'OVERRIDE_AVAILABLE' && 'Có thể vượt sĩ số'}
                        {preview.recommendation.type === 'BLOCKED' && 'Lớp đã đầy'}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        preview.recommendation.type === 'OK' && "text-emerald-700",
                        preview.recommendation.type === 'PARTIAL_SUGGESTED' && "text-sky-700",
                        preview.recommendation.type === 'OVERRIDE_AVAILABLE' && "text-amber-700",
                        preview.recommendation.type === 'BLOCKED' && "text-rose-700"
                      )}>
                        {preview.recommendation.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto bg-muted/5 p-6">
                <div className="max-w-5xl mx-auto space-y-6">

                  {/* Strategy Selection */}
                  <Card className="py-0">
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Tùy chọn đăng ký
                      </h4>
                      
                      {/* Main strategy: ALL or PARTIAL */}
                      <RadioGroup 
                        value={baseStrategy} 
                        onValueChange={(v) => setBaseStrategy(v as 'ALL' | 'PARTIAL')} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="strategy-all"
                          className={cn(
                            "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            baseStrategy === 'ALL' && "border-primary bg-primary/5 ring-1 ring-primary"
                          )}
                        >
                          <RadioGroupItem value="ALL" id="strategy-all" className="sr-only" />
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">Đăng ký tất cả</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Đăng ký toàn bộ {validStudentsList.length} sinh viên hợp lệ vào lớp.
                          </span>
                        </Label>

                        <Label
                          htmlFor="strategy-partial"
                          className={cn(
                            "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            baseStrategy === 'PARTIAL' && "border-primary bg-primary/5 ring-1 ring-primary"
                          )}
                        >
                          <RadioGroupItem value="PARTIAL" id="strategy-partial" className="sr-only" />
                          <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="h-4 w-4 text-primary" />
                            <span className="font-medium">Chọn sinh viên</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Chỉ đăng ký những sinh viên bạn tick chọn từ danh sách bên dưới.
                          </span>
                        </Label>
                      </RadioGroup>

                      {/* Override capacity checkbox - shows when capacity will be exceeded */}
                      {willExceedCapacity && (
                        <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2">
                          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <Checkbox
                              id="override-capacity"
                              checked={overrideCapacity}
                              onCheckedChange={(checked) => setOverrideCapacity(checked === true)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <Label htmlFor="override-capacity" className="text-sm font-medium text-amber-800 cursor-pointer">
                                Cho phép vượt sĩ số tối đa
                              </Label>
                              <p className="text-xs text-amber-700 mt-1">
                                Đăng ký sẽ vượt quá sức chứa lớp ({preview.currentEnrolled + studentsToEnrollCount}/{preview.maxCapacity}).
                                Tick vào đây nếu bạn xác nhận muốn tiếp tục.
                              </p>
                              
                              {overrideCapacity && (
                                <div className="mt-3">
                                  <Label className="text-xs font-medium text-amber-800">Lý do vượt sĩ số (Bắt buộc)</Label>
                                  <Textarea
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="Nhập lý do tại sao cần đăng ký vượt quá sức chứa..."
                                    className="mt-1.5 resize-none text-sm"
                                    rows={2}
                                  />
                                  <p className="text-xs text-amber-600 mt-1 text-right">
                                    {overrideReason.length}/20 ký tự tối thiểu
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary of what will happen */}
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Kết quả:</span>{' '}
                          {baseStrategy === 'ALL' 
                            ? `Sẽ đăng ký ${validStudentsList.length} sinh viên`
                            : selectedStudents.size > 0 
                              ? `Sẽ đăng ký ${selectedStudents.size} sinh viên đã chọn`
                              : 'Chưa chọn sinh viên nào'
                          }
                          {overrideCapacity && ' (vượt sĩ số)'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Student List - Single table with all students */}
                  <Card className="overflow-hidden border-none shadow-none bg-transparent">
                    <div className="rounded-md border bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            {baseStrategy === 'PARTIAL' && (
                              <TableHead className="w-[50px] pl-4">
                                <Checkbox
                                  checked={isAllSelected}
                                  onCheckedChange={toggleAllSelection}
                                />
                              </TableHead>
                            )}
                            <TableHead className="min-w-[250px]">Sinh viên</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Liên hệ</TableHead>
                            <TableHead>Thông tin khác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allStudentsSorted.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={baseStrategy === 'PARTIAL' ? 5 : 4} className="h-24 text-center text-muted-foreground">
                                Không có sinh viên nào
                              </TableCell>
                            </TableRow>
                          ) : (
                            allStudentsSorted.map((student) => {
                              const realIdx = preview.students.indexOf(student)
                              const isValid = isStudentValid(student)
                              const studentId = student.status === 'FOUND' ? student.resolvedStudentId : -realIdx - 1
                              const isSelected = selectedStudents.has(studentId!)
                              
                              return (
                                <TableRow 
                                  key={realIdx} 
                                  className={cn(
                                    "transition-colors",
                                    isValid ? "hover:bg-muted/30" : "opacity-50 bg-muted/20"
                                  )}
                                >
                                  {baseStrategy === 'PARTIAL' && (
                                    <TableCell className="pl-4">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleStudentSelection(student, realIdx)}
                                        disabled={!isValid}
                                      />
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className={cn("h-9 w-9 border", !isValid && "grayscale")}>
                                        <AvatarFallback className={cn(
                                          "text-xs",
                                          isValid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                          {getInitials(student.fullName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className={cn("font-medium text-sm", !isValid && "text-muted-foreground")}>
                                          {student.fullName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{student.dob} • {student.gender}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      {student.status === 'FOUND' && (
                                        <Badge variant="success">
                                          Đã có hồ sơ
                                        </Badge>
                                      )}
                                      {student.status === 'CREATE' && (
                                        <Badge variant="info">
                                          Tạo mới
                                        </Badge>
                                      )}
                                      {student.status === 'DUPLICATE' && (
                                        <Badge variant="warning">
                                          Đã đăng ký lớp này
                                        </Badge>
                                      )}
                                      {student.status === 'ERROR' && (
                                        <Badge variant="destructive">
                                          Lỗi dữ liệu
                                        </Badge>
                                      )}
                                      {student.errorMessage && (
                                        <p className="text-xs text-rose-600 max-w-[200px]">{student.errorMessage}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className={cn("flex flex-col text-sm", !isValid && "text-muted-foreground")}>
                                      <span>{student.email}</span>
                                      <span className="text-muted-foreground text-xs">{student.phone}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className={cn("text-sm max-w-[200px] truncate", !isValid ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                      {student.address || '-'}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </FullScreenModalBody>

        <FullScreenModalFooter className="bg-background border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {preview && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sức chứa lớp: 
                <span className={cn(
                  "font-medium",
                  willExceedCapacity ? "text-amber-600" : "text-foreground"
                )}>
                  {preview.currentEnrolled + studentsToEnrollCount}/{preview.maxCapacity}
                </span>
                {willExceedCapacity && !overrideCapacity && (
                  <span className="text-amber-600 text-xs">(vượt sĩ số)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            {preview && (
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !canProceed}
                className="min-w-[140px]"
              >
                {isExecuting ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    Xác nhận đăng ký
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  )
}
