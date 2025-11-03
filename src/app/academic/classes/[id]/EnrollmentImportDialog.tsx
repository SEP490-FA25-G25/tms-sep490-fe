import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import {
  usePreviewClassEnrollmentImportMutation,
  useExecuteClassEnrollmentImportMutation,
  type ClassEnrollmentImportPreview,
  type EnrollmentStrategy,
} from '@/store/services/enrollmentApi'
import { toast } from 'sonner'

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

  const [previewMutation, { isLoading: isPreviewing }] = usePreviewClassEnrollmentImportMutation()
  const [executeMutation, { isLoading: isExecuting }] = useExecuteClassEnrollmentImportMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(null)
      setStrategy('ALL')
      setSelectedStudents(new Set())
    }
  }

  const handlePreview = async () => {
    if (!file) return

    try {
      const result = await previewMutation({ classId, file }).unwrap()
      setPreview(result.data)
      setStrategy(result.data.recommendation.recommendedStrategy)
      toast.success('Preview loaded successfully')
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
        ? String(error.data.message)
        : 'Failed to preview import'
      toast.error(errorMessage)
    }
  }

  const handleExecute = async () => {
    if (!preview) return

    // Validate strategy requirements
    if (strategy === 'PARTIAL' && selectedStudents.size === 0) {
      toast.error('Please select at least one student for partial enrollment')
      return
    }

    if (strategy === 'OVERRIDE' && overrideReason.trim().length < 20) {
      toast.error('Override reason must be at least 20 characters')
      return
    }

    try {
      const result = await executeMutation({
        classId: preview.classId,
        strategy,
        selectedStudentIds: strategy === 'PARTIAL' ? Array.from(selectedStudents) : undefined,
        overrideReason: strategy === 'OVERRIDE' ? overrideReason : undefined,
        students: preview.students,
      }).unwrap()

      toast.success(
        `Successfully enrolled ${result.data.enrolledCount} students. Created ${result.data.totalStudentSessionsCreated} session records.`
      )
      onSuccess()
      handleClose()
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
        ? String(error.data.message)
        : 'Failed to execute enrollment'
      toast.error(errorMessage)
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

  const toggleStudentSelection = (studentId: number) => {
    const newSet = new Set(selectedStudents)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setSelectedStudents(newSet)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FOUND':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CREATE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FOUND':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'CREATE':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students via Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file to enroll multiple students at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Excel File</Label>
            <div className="flex gap-3">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={isPreviewing || isExecuting}
              />
              <Button
                onClick={handlePreview}
                disabled={!file || isPreviewing || isExecuting}
              >
                <Upload className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload .xlsx file with columns: Student Code, Full Name, Email, Phone
            </p>
          </div>

          {/* Preview Results */}
          {preview && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Valid</div>
                  <div className="text-2xl font-semibold">{preview.totalValid}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Existing</div>
                  <div className="text-2xl font-semibold text-green-600">{preview.foundCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">New Students</div>
                  <div className="text-2xl font-semibold text-blue-600">{preview.createCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Errors</div>
                  <div className="text-2xl font-semibold text-red-600">{preview.errorCount}</div>
                </div>
              </div>

              {/* Capacity Info */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Capacity Status</span>
                  {preview.exceedsCapacity ? (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Exceeds by {preview.exceededBy}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Within Capacity
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current: {preview.currentEnrolled} / Max: {preview.maxCapacity} / Available: {preview.availableSlots}
                </div>
              </div>

              {/* Warnings & Errors */}
              {preview.warnings.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="font-medium text-yellow-900 mb-1">Warnings</div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {preview.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="font-medium text-red-900 mb-1">Errors</div>
                  <ul className="text-sm text-red-800 space-y-1">
                    {preview.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              <div className={`rounded-lg border p-4 ${preview.recommendation.canProceed ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className={`font-medium mb-1 ${preview.recommendation.canProceed ? 'text-blue-900' : 'text-red-900'}`}>
                  Recommendation
                </div>
                <p className={`text-sm ${preview.recommendation.canProceed ? 'text-blue-800' : 'text-red-800'}`}>
                  {preview.recommendation.message}
                </p>
              </div>

              {/* Strategy Selection */}
              {preview.recommendation.canProceed && (
                <div className="space-y-2">
                  <Label htmlFor="strategy">Enrollment Strategy</Label>
                  <Select value={strategy} onValueChange={(value) => setStrategy(value as EnrollmentStrategy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Enroll All Valid Students</SelectItem>
                      <SelectItem value="PARTIAL">Enroll Selected Students Only</SelectItem>
                      {preview.exceedsCapacity && (
                        <SelectItem value="OVERRIDE">Override Capacity (Requires Reason)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Override Reason */}
              {strategy === 'OVERRIDE' && (
                <div className="space-y-2">
                  <Label htmlFor="override-reason">Override Reason (min 20 characters)</Label>
                  <Textarea
                    id="override-reason"
                    value={overrideReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverrideReason(e.target.value)}
                    placeholder="Explain why capacity override is necessary..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {overrideReason.length} / 20 characters
                  </p>
                </div>
              )}

              {/* Students Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Students ({preview.students.length})</h4>
                  {strategy === 'PARTIAL' && (
                    <span className="text-sm text-muted-foreground">
                      {selectedStudents.size} selected
                    </span>
                  )}
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {strategy === 'PARTIAL' && <TableHead className="w-[50px]"></TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.students.map((student, idx) => (
                        <TableRow key={idx} className={student.status === 'ERROR' ? 'bg-red-50' : undefined}>
                          {strategy === 'PARTIAL' && (
                            <TableCell>
                              {student.status !== 'ERROR' && student.existingStudentId && (
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.has(student.existingStudentId)}
                                  onChange={() => toggleStudentSelection(student.existingStudentId!)}
                                  className="h-4 w-4"
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(student.status)}
                              <Badge variant="outline" className={getStatusColor(student.status)}>
                                {student.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{student.studentCode}</TableCell>
                          <TableCell>{student.fullName}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isExecuting}>
              Cancel
            </Button>
            {preview && preview.recommendation.canProceed && (
              <Button onClick={handleExecute} disabled={isExecuting}>
                {isExecuting ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
