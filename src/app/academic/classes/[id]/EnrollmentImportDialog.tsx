import { useState } from 'react'
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
  useDownloadEnrollmentTemplateQuery,
  useDownloadClassEnrollmentTemplateQuery,
  type ClassEnrollmentImportPreview,
  type EnrollmentStrategy,
} from '@/store/services/enrollmentApi'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

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

  // Template download queries
  const genericTemplateQuery = useDownloadEnrollmentTemplateQuery()
  const classTemplateQuery = useDownloadClassEnrollmentTemplateQuery({ classId }, { skip: !open })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setPreview(null)
      setStrategy('ALL')
      setSelectedStudents(new Set())
    }
  }

  const handleDownloadGenericTemplate = async () => {
    try {
      const result = await genericTemplateQuery.data
      if (!result) {
        toast.error('Template not available')
        return
      }
      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-enrollment-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Generic template downloaded')
    } catch (error) {
      toast.error('Failed to download generic template')
    }
  }

  const handleDownloadClassTemplate = async () => {
    try {
      const result = await classTemplateQuery.data
      if (!result) {
        toast.error('Template not available')
        return
      }
      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = `class-${classId}-enrollment-template.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Class-specific template downloaded')
    } catch (error) {
      toast.error('Failed to download class template')
    }
  }

  const handlePreview = async () => {
    if (!file) return

    try {
      const result = await previewMutation({ classId, file }).unwrap()
      setPreview(result.data)

      // Set strategy based on recommendation type
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
      // For PARTIAL strategy, filter students to only include selected ones
      const studentsToEnroll = strategy === 'PARTIAL'
        ? preview.students.filter((_, idx) => selectedStudents.has(idx))
        : preview.students

      const result = await executeMutation({
        classId: preview.classId,
        strategy,
        selectedStudentIds: strategy === 'PARTIAL' ? Array.from(selectedStudents) : undefined,
        overrideReason: strategy === 'OVERRIDE' ? overrideReason : undefined,
        students: studentsToEnroll,
      }).unwrap()

      toast.success(
        `Successfully enrolled ${result.data.successfulEnrollments} out of ${result.data.totalAttempted} students into ${result.data.className}`
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
      case 'DUPLICATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
      case 'DUPLICATE':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent>
        <FullScreenModalHeader>
          <FullScreenModalTitle>Import Students via Excel</FullScreenModalTitle>
          <FullScreenModalDescription>
            Upload an Excel file to enroll multiple students at once
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody className="space-y-6">
          {/* Template Download */}
          <div className="space-y-2">
            <Label>Download Excel Template</Label>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadGenericTemplate}
                disabled={genericTemplateQuery.isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Generic Template
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadClassTemplate}
                disabled={classTemplateQuery.isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Class-Specific Template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Download template with required columns: full_name, email, phone, facebook_url, address, gender, dob
            </p>
          </div>

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
                {isPreviewing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload .xlsx file with 7 columns: full_name, email, phone, facebook_url, address, gender, dob. Max file size: 10MB
            </p>
          </div>

          {/* Preview Results */}
          {preview && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Students</div>
                  <div className="text-2xl font-semibold">{preview.totalStudents}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Valid</div>
                  <div className="text-2xl font-semibold">{preview.totalValid}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">New Students</div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {preview.students.filter(s => s.status === 'CREATE').length}
                  </div>
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
                  {preview.availableSlots >= preview.totalValid ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Available: {preview.availableSlots}
                    </Badge>
                  ) : preview.availableSlots > 0 ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Partial Fit: {preview.availableSlots}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Class Full
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
              <div className={`rounded-lg border p-4 ${
                preview.recommendation.type === 'PROCEED' ? 'border-green-200 bg-green-50' :
                preview.recommendation.type === 'PARTIAL' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className={`font-medium mb-1 ${
                  preview.recommendation.type === 'PROCEED' ? 'text-green-900' :
                  preview.recommendation.type === 'PARTIAL' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  Recommendation: {preview.recommendation.type}
                </div>
                <p className={`text-sm ${
                  preview.recommendation.type === 'PROCEED' ? 'text-green-800' :
                  preview.recommendation.type === 'PARTIAL' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {preview.recommendation.message}
                </p>
                {preview.recommendation.suggestedEnrollCount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested enrollment count: {preview.recommendation.suggestedEnrollCount}
                  </p>
                )}
              </div>

              {/* Strategy Selection */}
              <div className="space-y-2">
                <Label htmlFor="strategy">Enrollment Strategy</Label>
                <Select value={strategy} onValueChange={(value) => setStrategy(value as EnrollmentStrategy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Enroll All Valid Students</SelectItem>
                    <SelectItem value="PARTIAL">Enroll Selected Students Only</SelectItem>
                    <SelectItem value="OVERRIDE">Override Capacity (Requires Reason)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {strategy === 'PARTIAL' && <TableHead className="w-[50px]"></TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Facebook URL</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.students.map((student, idx) => (
                        <TableRow key={idx} className={student.status === 'ERROR' ? 'bg-red-50' : undefined}>
                          {strategy === 'PARTIAL' && (
                            <TableCell>
                              {student.status !== 'ERROR' && student.status !== 'DUPLICATE' && (
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.has(idx)}
                                  onChange={() => toggleStudentSelection(idx)}
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
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            {student.facebookUrl ? (
                              <a
                                href={student.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Profile
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{student.address || '-'}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>{student.dob}</TableCell>
                          {student.status === 'ERROR' && (
                            <TableCell className="text-red-600 text-sm max-w-xs">
                              {student.errorMessage}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </FullScreenModalBody>

        <FullScreenModalFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isExecuting}>
              Cancel
            </Button>
            {preview && (
              <Button onClick={handleExecute} disabled={isExecuting || (strategy === 'PARTIAL' && selectedStudents.size === 0)}>
                {isExecuting ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
            )}
          </div>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  )
}
