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
  CheckCircle2,
} from 'lucide-react'
import {
  useDownloadStudentImportTemplateQuery,
  usePreviewStudentImportMutation,
  useExecuteStudentImportMutation,
  type StudentImportPreview,
  type StudentImportData,
} from '@/store/services/studentApi'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StudentImportDialogProps {
  branchId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StudentImportDialog({
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: StudentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<StudentImportPreview | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewMutation, { isLoading: isPreviewing }] = usePreviewStudentImportMutation()
  const [executeMutation, { isLoading: isExecuting }] = useExecuteStudentImportMutation()
  const templateQuery = useDownloadStudentImportTemplateQuery(undefined, { skip: !open })

  // Computed values
  const createStudentsList = preview?.students.filter(s => s.status === 'CREATE') || []
  const foundStudentsList = preview?.students.filter(s => s.status === 'FOUND') || []
  const errorStudentsList = preview?.students.filter(s => s.status === 'ERROR') || []

  // Check if a student can be selected (only CREATE status)
  const isStudentSelectable = (student: StudentImportData) => {
    return student.status === 'CREATE'
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
    setSelectedIndices(new Set())

    // Auto preview
    previewFile(selectedFile)
  }

  const previewFile = async (fileToPreview: File) => {
    try {
      const result = await previewMutation({ branchId, file: fileToPreview }).unwrap()
      setPreview(result.data)

      // Auto-select all CREATE students
      const createIndices = new Set<number>()
      result.data.students.forEach((student, idx) => {
        if (student.status === 'CREATE') {
          createIndices.add(idx)
        }
      })
      setSelectedIndices(createIndices)
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

  const handleDownloadTemplate = () => {
    try {
      const result = templateQuery.data
      if (!result) return

      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mau-nhap-hoc-vien.xlsx'
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

    if (createStudentsList.length === 0) {
      toast.error('Không có học viên mới nào để nhập')
      return
    }

    if (selectedIndices.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học viên để nhập')
      return
    }

    try {
      const result = await executeMutation({
        branchId: preview.branchId,
        students: preview.students,
        selectedIndices: Array.from(selectedIndices),
      }).unwrap()

      toast.success(
        `Đã nhập thành công ${result.data.successfulCreations} học viên`
      )
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || 'Nhập học viên thất bại')
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setSelectedIndices(new Set())
    onOpenChange(false)
  }

  const toggleStudentSelection = (idx: number, student: StudentImportData) => {
    if (!isStudentSelectable(student)) return

    const newSet = new Set(selectedIndices)
    if (newSet.has(idx)) {
      newSet.delete(idx)
    } else {
      newSet.add(idx)
    }
    setSelectedIndices(newSet)
  }

  const toggleAllSelection = () => {
    if (!preview) return
    const allCreateSelected = createStudentsList.every((s) => {
      const idx = preview.students.indexOf(s)
      return selectedIndices.has(idx)
    })

    const newSet = new Set(selectedIndices)
    createStudentsList.forEach((s) => {
      const idx = preview.students.indexOf(s)
      if (allCreateSelected) {
        newSet.delete(idx)
      } else {
        newSet.add(idx)
      }
    })
    setSelectedIndices(newSet)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isAllSelected = createStudentsList.length > 0 && createStudentsList.every((s) => {
    if (!preview) return false
    const idx = preview.students.indexOf(s)
    return selectedIndices.has(idx)
  })

  const canProceed = preview && createStudentsList.length > 0 && selectedIndices.size > 0

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent size="2xl" className="bg-muted/10 p-0 gap-0">
        <FullScreenModalHeader className="bg-background border-b px-6 py-4">
          <FullScreenModalTitle className="text-xl font-semibold tracking-tight">
            Nhập học viên từ Excel
          </FullScreenModalTitle>
          <FullScreenModalDescription>
            Tải lên danh sách học viên để thêm hàng loạt vào hệ thống.
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

              <div className="mt-6 w-full max-w-xl">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleDownloadTemplate}
                  disabled={!templateQuery.data}
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">Tải xuống mẫu Excel</p>
                    <p className="text-xs text-muted-foreground">File mẫu bao gồm 7 cột thông tin học viên</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Summary Header */}
              <div className="bg-background border-b p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl">
                      <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{file?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {preview.students.length} học viên • 
                        <span className="text-emerald-600 font-medium"> {createStudentsList.length} mới</span>
                        {foundStudentsList.length > 0 && (
                          <span className="text-sky-600 font-medium"> • {foundStudentsList.length} đã có</span>
                        )}
                        {errorStudentsList.length > 0 && (
                          <span className="text-rose-600 font-medium"> • {errorStudentsList.length} lỗi</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hủy bỏ
                  </Button>
                </div>

                {/* Info banners */}
                {foundStudentsList.length > 0 && (
                  <div className="mb-3 p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-start gap-3">
                    <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-sky-800">
                        {foundStudentsList.length} học viên đã tồn tại trong hệ thống
                      </p>
                      <p className="text-xs text-sky-700 mt-1">
                        Những học viên này sẽ được bỏ qua và không tạo mới.
                      </p>
                    </div>
                  </div>
                )}

                {errorStudentsList.length > 0 && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {errorStudentsList.length} học viên có lỗi dữ liệu
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Vui lòng kiểm tra và sửa lỗi trong file Excel, sau đó tải lại.
                      </p>
                    </div>
                  </div>
                )}

                {createStudentsList.length > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">
                        Sẵn sàng nhập {selectedIndices.size}/{createStudentsList.length} học viên mới
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Chọn học viên bạn muốn nhập vào hệ thống bên dưới.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area - Student List */}
              <div className="flex-1 overflow-auto bg-muted/5 p-6">
                <div className="max-w-5xl mx-auto">
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[50px] pl-4">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={toggleAllSelection}
                              disabled={createStudentsList.length === 0}
                            />
                          </TableHead>
                          <TableHead className="min-w-[250px]">Học viên</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Liên hệ</TableHead>
                          <TableHead>Thông tin khác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                              Không có học viên nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          preview.students.map((student, idx) => {
                            const isSelectable = isStudentSelectable(student)
                            const isSelected = selectedIndices.has(idx)
                            
                            return (
                              <TableRow 
                                key={idx} 
                                className={cn(
                                  "transition-colors",
                                  isSelectable ? "hover:bg-muted/30" : "opacity-60 bg-muted/20"
                                )}
                              >
                                <TableCell className="pl-4">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleStudentSelection(idx, student)}
                                    disabled={!isSelectable}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className={cn("h-9 w-9 border", !isSelectable && "grayscale")}>
                                      <AvatarFallback className={cn(
                                        "text-xs",
                                        isSelectable ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                      )}>
                                        {getInitials(student.fullName || '??')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className={cn("font-medium text-sm", !isSelectable && "text-muted-foreground")}>
                                        {student.fullName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {student.dob} • {student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {student.status === 'CREATE' && (
                                      <Badge variant="info">
                                        Tạo mới
                                      </Badge>
                                    )}
                                    {student.status === 'FOUND' && (
                                      <Badge variant="secondary">
                                        Đã có: {student.existingStudentCode}
                                      </Badge>
                                    )}
                                    {student.status === 'ERROR' && (
                                      <Badge variant="destructive">
                                        Lỗi
                                      </Badge>
                                    )}
                                    {student.errorMessage && (
                                      <p className="text-xs text-rose-600 max-w-[200px]">{student.errorMessage}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={cn("flex flex-col text-sm", !isSelectable && "text-muted-foreground")}>
                                    <span>{student.email}</span>
                                    <span className="text-muted-foreground text-xs">{student.phone || '-'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={cn("text-sm max-w-[200px] truncate", !isSelectable ? "text-muted-foreground/50" : "text-muted-foreground")}>
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
                Đã chọn: <span className="font-medium text-foreground">{selectedIndices.size}</span> học viên
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
                    Nhập học viên
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
