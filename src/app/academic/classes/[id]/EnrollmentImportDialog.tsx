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
  ArrowRight
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [strategy, setStrategy] = useState<EnrollmentStrategy>('ALL')
  const [overrideReason, setOverrideReason] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<string>('valid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewMutation, { isLoading: isPreviewing }] = usePreviewClassEnrollmentImportMutation()
  const [executeMutation, { isLoading: isExecuting }] = useExecuteClassEnrollmentImportMutation()

  const genericTemplateQuery = useDownloadEnrollmentTemplateQuery()
  const classTemplateQuery = useDownloadClassEnrollmentTemplateQuery({ classId }, { skip: !open })

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
    setStrategy('ALL')
    setSelectedStudents(new Set())

    // Auto preview
    previewFile(selectedFile)
  }

  const previewFile = async (fileToPreview: File) => {
    try {
      const result = await previewMutation({ classId, file: fileToPreview }).unwrap()
      setPreview(result.data)

      switch (result.data.recommendation.type) {
        case 'PROCEED':
          setStrategy('ALL')
          break
        case 'PARTIAL':
          setStrategy('PARTIAL')
          break
        case 'OVERFLOW':
        case 'BLOCKED':
          setStrategy('OVERRIDE')
          break
        default:
          setStrategy('ALL')
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Xem trước dữ liệu thất bại'
      toast.error(errorMessage)
      setFile(null) // Reset file on error
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

    const validStudents = preview.students.filter(student =>
      student.status !== 'ERROR' && student.status !== 'DUPLICATE'
    )

    if (validStudents.length === 0) {
      toast.error('Không có sinh viên hợp lệ để đăng ký')
      return
    }

    if (strategy === 'PARTIAL' && selectedStudents.size === 0) {
      toast.error('Vui lòng chọn ít nhất một sinh viên')
      return
    }

    if (strategy === 'OVERRIDE' && overrideReason.trim().length < 20) {
      toast.error('Lý do ghi đè phải có ít nhất 20 ký tự')
      return
    }

    try {
      const studentsToEnroll = strategy === 'PARTIAL'
        ? preview.students.filter((student, idx) => {
          if (student.status === 'ERROR' || student.status === 'DUPLICATE') return false
          const studentId = student.status === 'FOUND' ? student.resolvedStudentId : -idx - 1
          return selectedStudents.has(studentId!)
        })
        : preview.students.filter(student => student.status !== 'ERROR' && student.status !== 'DUPLICATE')

      const result = await executeMutation({
        classId: preview.classId,
        strategy,
        selectedStudentIds: strategy === 'PARTIAL' ? Array.from(selectedStudents) : undefined,
        overrideReason: strategy === 'OVERRIDE' ? overrideReason : undefined,
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
    setStrategy('ALL')
    setOverrideReason('')
    setSelectedStudents(new Set())
    onOpenChange(false)
  }

  const toggleStudentSelection = (student: StudentEnrollmentData, idx: number) => {
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
    const validStudents = preview.students.filter(s => s.status !== 'ERROR' && s.status !== 'DUPLICATE')
    const allSelected = validStudents.every((s, idx) => {
      const id = s.status === 'FOUND' ? s.resolvedStudentId : -idx - 1
      return selectedStudents.has(id!)
    })

    const newSet = new Set(selectedStudents)
    validStudents.forEach((s, idx) => {
      const id = s.status === 'FOUND' ? s.resolvedStudentId : -idx - 1
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

  const validStudentsList = preview?.students.filter(s => s.status !== 'ERROR' && s.status !== 'DUPLICATE') || []
  const errorStudentsList = preview?.students.filter(s => s.status === 'ERROR' || s.status === 'DUPLICATE') || []
  const isAllSelected = validStudentsList.length > 0 && validStudentsList.every((s) => {
    if (!preview) return false
    const id = s.status === 'FOUND' ? s.resolvedStudentId : -preview.students.indexOf(s) - 1
    return selectedStudents.has(id!)
  })

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent className="bg-muted/10 p-0 gap-0">
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
              <div className="bg-background border-b p-6 pb-2">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <FileSpreadsheet className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{file?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {preview.totalStudents} sinh viên tìm thấy • {preview.totalValid} hợp lệ
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hủy bỏ
                  </Button>
                </div>

                <div className="flex gap-2 mb-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
                      <TabsTrigger
                        value="valid"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                      >
                        Hợp lệ <Badge variant="secondary" className="ml-2">{validStudentsList.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="error"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent px-0 py-2"
                        disabled={errorStudentsList.length === 0}
                      >
                        Lỗi / Trùng lặp <Badge variant="destructive" className="ml-2">{errorStudentsList.length}</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto bg-muted/5 p-6">
                <div className="max-w-5xl mx-auto space-y-6">

                  {/* Strategy Selection */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Tùy chọn đăng ký
                      </h4>
                      <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as EnrollmentStrategy)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Label
                          htmlFor="strategy-all"
                          className={cn(
                            "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            strategy === 'ALL' && "border-primary bg-primary/5 ring-1 ring-primary"
                          )}
                        >
                          <RadioGroupItem value="ALL" id="strategy-all" className="sr-only" />
                          <span className="font-medium mb-1">Tất cả hợp lệ</span>
                          <span className="text-xs text-muted-foreground">Đăng ký toàn bộ {preview.totalValid} sinh viên hợp lệ vào lớp.</span>
                        </Label>

                        <Label
                          htmlFor="strategy-partial"
                          className={cn(
                            "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            strategy === 'PARTIAL' && "border-primary bg-primary/5 ring-1 ring-primary"
                          )}
                        >
                          <RadioGroupItem value="PARTIAL" id="strategy-partial" className="sr-only" />
                          <span className="font-medium mb-1">Chọn thủ công</span>
                          <span className="text-xs text-muted-foreground">Chỉ đăng ký những sinh viên được chọn từ danh sách.</span>
                        </Label>

                        <Label
                          htmlFor="strategy-override"
                          className={cn(
                            "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            strategy === 'OVERRIDE' && "border-primary bg-primary/5 ring-1 ring-primary"
                          )}
                        >
                          <RadioGroupItem value="OVERRIDE" id="strategy-override" className="sr-only" />
                          <span className="font-medium mb-1">Ghi đè sức chứa</span>
                          <span className="text-xs text-muted-foreground">Cho phép đăng ký vượt quá sĩ số tối đa của lớp.</span>
                        </Label>
                      </RadioGroup>

                      {strategy === 'OVERRIDE' && (
                        <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2">
                          <Label className="text-sm font-medium mb-2 block">Lý do ghi đè (Bắt buộc)</Label>
                          <Textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Nhập lý do tại sao cần đăng ký vượt quá sức chứa..."
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            {overrideReason.length} / 20 ký tự
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Student List */}
                  <Card className="overflow-hidden border-none shadow-none bg-transparent">
                    <div className="rounded-md border bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            {activeTab === 'valid' && strategy === 'PARTIAL' && (
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
                          {(activeTab === 'valid' ? validStudentsList : errorStudentsList).map((student, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/30">
                              {activeTab === 'valid' && strategy === 'PARTIAL' && (
                                <TableCell className="pl-4">
                                  <Checkbox
                                    checked={(() => {
                                      const id = student.status === 'FOUND' ? student.resolvedStudentId : -preview.students.indexOf(student) - 1
                                      return selectedStudents.has(id!)
                                    })()}
                                    onCheckedChange={() => toggleStudentSelection(student, preview.students.indexOf(student))}
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(student.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{student.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{student.dob} • {student.gender}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.status === 'FOUND' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã có hồ sơ</Badge>}
                                {student.status === 'CREATE' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Tạo mới</Badge>}
                                {student.status === 'DUPLICATE' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Trùng lặp</Badge>}
                                {student.status === 'ERROR' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Lỗi dữ liệu</Badge>}
                                {student.errorMessage && <p className="text-xs text-red-600 mt-1 max-w-[200px]">{student.errorMessage}</p>}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col text-sm">
                                  <span>{student.email}</span>
                                  <span className="text-muted-foreground text-xs">{student.phone}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {student.address || '-'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
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
                Sức chứa lớp: <span className="font-medium text-foreground">{preview.currentEnrolled}/{preview.maxCapacity}</span>
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
                disabled={isExecuting || (strategy === 'PARTIAL' && selectedStudents.size === 0)}
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
