import { useState } from 'react'
import {
    useLazyDownloadUserImportTemplateQuery,
    usePreviewUserImportMutation,
    useExecuteUserImportMutation,
    type UserImportData
} from '@/store/services/userApi'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface UserImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function UserImportDialog({ open, onOpenChange, onSuccess }: UserImportDialogProps) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<UserImportData[]>([])

    const [downloadTemplate, { isLoading: isDownloading }] = useLazyDownloadUserImportTemplateQuery()
    const [previewImport, { isLoading: isPreviewing }] = usePreviewUserImportMutation()
    const [executeImport, { isLoading: isExecuting }] = useExecuteUserImportMutation()

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0])
            }
        },
    })

    const handleDownloadTemplate = async () => {
        try {
            await downloadTemplate().unwrap()
            toast.success('Đã tải xuống mẫu import')
        } catch {
            toast.error('Lỗi khi tải mẫu import')
        }
    }

    const handlePreview = async () => {
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await previewImport(formData).unwrap()
            if (response.success && response.data) {
                setPreviewData(response.data.users)
                setStep('preview')
            } else {
                toast.error(response.message || 'Lỗi khi preview')
            }
        } catch (error: unknown) {
            const message = (error as { data?: { message?: string } })?.data?.message
            toast.error(message || 'Lỗi khi upload file')
        }
    }

    const handleExecute = async () => {
        const validUsers = previewData.filter(u => u.valid)
        if (validUsers.length === 0) {
            toast.error('Không có người dùng hợp lệ để import')
            return
        }

        try {
            const response = await executeImport(validUsers).unwrap()
            if (response.success) {
                toast.success(`Đã import thành công ${response.data} người dùng`)
                onSuccess()
                onOpenChange(false)
                resetState()
            } else {
                toast.error(response.message || 'Lỗi khi import')
            }
        } catch (error: unknown) {
            const message = (error as { data?: { message?: string } })?.data?.message
            toast.error(message || 'Lỗi khi thực hiện import')
        }
    }

    const resetState = () => {
        setStep('upload')
        setFile(null)
        setPreviewData([])
    }

    const validCount = previewData.filter(u => u.valid).length
    const errorCount = previewData.filter(u => !u.valid).length

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetState()
            onOpenChange(val)
        }}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] sm:max-w-6xl flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>Import Người dùng từ Excel</DialogTitle>
                    <DialogDescription>
                        Tải lên file Excel danh sách người dùng để thêm vào hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1">
                    {step === 'upload' ? (
                        <div className="flex flex-col items-center justify-center space-y-6 py-10">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-xl",
                                    isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                        {file ? file.name : "Kéo thả file vào đây hoặc click để chọn file"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Chỉ hỗ trợ file .xlsx
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-muted-foreground">Chưa có file mẫu?</p>
                                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={isDownloading}>
                                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Tải file mẫu
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Hợp lệ: {validCount}
                                    </Badge>
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        Lỗi: {errorCount}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border rounded-md flex-1 overflow-x-auto">
                                <ScrollArea className="h-[500px]">
                                    <Table className="min-w-[1000px]">
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead className="w-[80px]">Trạng thái</TableHead>
                                                <TableHead className="min-w-[150px]">Họ tên</TableHead>
                                                <TableHead className="min-w-[200px]">Email</TableHead>
                                                <TableHead className="min-w-[120px]">SĐT</TableHead>
                                                <TableHead className="min-w-[120px]">Vai trò</TableHead>
                                                <TableHead className="min-w-[150px]">Chi nhánh</TableHead>
                                                <TableHead className="min-w-[250px]">Lỗi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((user, index) => (
                                                <TableRow key={index} className={!user.valid ? "bg-red-50" : ""}>
                                                    <TableCell>
                                                        {user.valid ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-500" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{user.fullName}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{user.phone}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{user.role}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{user.branchCode}</TableCell>
                                                    <TableCell className="text-red-600 text-sm" title={user.errorMessage}>
                                                        {user.errorMessage}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    {step === 'upload' ? (
                        <Button onClick={handlePreview} disabled={!file || isPreviewing}>
                            {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tiếp tục
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('upload')}>Quay lại</Button>
                            <Button onClick={handleExecute} disabled={validCount === 0 || isExecuting}>
                                {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import {validCount} người dùng
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
