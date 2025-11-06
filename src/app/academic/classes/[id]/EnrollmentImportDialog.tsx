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
      const result = genericTemplateQuery.data
      if (!result) return

      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-enrollment-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      // Silent fail - user can retry
    }
  }

  const handleDownloadClassTemplate = async () => {
    try {
      const result = classTemplateQuery.data
      if (!result) return

      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = `class-${classId}-enrollment-template.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      // Silent fail - user can retry
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

      // Preview loaded silently - user can see results immediately
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
          {/* File Upload - Simplified */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="excel-file" className="text-base font-medium">Excel File Upload</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  7 columns: full_name, email, phone, facebook_url, address, gender, dob
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadGenericTemplate}
                  disabled={genericTemplateQuery.isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadClassTemplate}
                  disabled={classTemplateQuery.isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Class Template
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={isPreviewing || isExecuting}
                className="flex-1"
              />
              <Button
                onClick={handlePreview}
                disabled={!file || isPreviewing || isExecuting}
              >
                {isPreviewing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Results */}
          {preview && (
            <>
              {/* Summary Stats - Minimal Design */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-sm text-muted-foreground">Total Students</span>
                    <p className="text-lg font-semibold">{preview.totalStudents}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Valid</span>
                    <p className="text-lg font-semibold">{preview.totalValid}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">New</span>
                    <p className="text-lg font-semibold text-blue-600">
                      {preview.students.filter(s => s.status === 'CREATE').length}
                    </p>
                  </div>
                  {preview.errorCount > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Errors</span>
                      <p className="text-lg font-semibold text-red-600">{preview.errorCount}</p>
                    </div>
                  )}
                </div>

                {/* Capacity Status Inline */}
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Class Capacity</span>
                  <p className="text-sm font-medium">
                    {preview.currentEnrolled}/{preview.maxCapacity}
                    <span className="ml-2 text-muted-foreground">
                      ({preview.availableSlots} slots available)
                    </span>
                  </p>
                </div>
              </div>

              {/* Warnings & Errors - Only show when needed */}
              {(preview.errors.length > 0 || preview.warnings.length > 0) && (
                <div className="space-y-2">
                  {preview.errors.length > 0 && (
                    <div className="text-sm p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                      <span className="font-medium">Errors:</span> {preview.errors.join(', ')}
                    </div>
                  )}

                  {preview.warnings.length > 0 && (
                    <div className="text-sm p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
                      <span className="font-medium">Warning:</span> {preview.warnings.join(', ')}
                    </div>
                  )}
                </div>
              )}

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

              {/* Override Reason - Simplified */}
              {strategy === 'OVERRIDE' && (
                <div className="border-t pt-4">
                  <Label htmlFor="override-reason" className="text-sm font-medium">
                    Override Reason (required)
                  </Label>
                  <Textarea
                    id="override-reason"
                    value={overrideReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverrideReason(e.target.value)}
                    placeholder="Explain why capacity override is necessary..."
                    rows={2}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {overrideReason.length} / 20 characters
                  </p>
                </div>
              )}

              {/* Students Table - Clean Design */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Students ({preview.students.length})</h3>
                  {strategy === 'PARTIAL' && (
                    <span className="text-xs text-muted-foreground">
                      {selectedStudents.size} selected
                    </span>
                  )}
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        {strategy === 'PARTIAL' && <TableHead className="w-12"></TableHead>}
                        <TableHead className="text-xs font-medium">Status</TableHead>
                        <TableHead className="text-xs font-medium">Full Name</TableHead>
                        <TableHead className="text-xs font-medium">Email</TableHead>
                        <TableHead className="text-xs font-medium">Phone</TableHead>
                        <TableHead className="text-xs font-medium">Facebook</TableHead>
                        <TableHead className="text-xs font-medium">Address</TableHead>
                        <TableHead className="text-xs font-medium">Gender</TableHead>
                        <TableHead className="text-xs font-medium">DOB</TableHead>
                        <TableHead className="text-xs font-medium">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.students.map((student, idx) => (
                        <TableRow key={idx} className="border-b">
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
                            <div className="flex items-center gap-1">
                              {getStatusIcon(student.status)}
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                student.status === 'FOUND' ? 'bg-green-100 text-green-700' :
                                student.status === 'CREATE' ? 'bg-blue-100 text-blue-700' :
                                student.status === 'DUPLICATE' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {student.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{student.fullName}</TableCell>
                          <TableCell className="text-sm">{student.email}</TableCell>
                          <TableCell className="text-sm">{student.phone}</TableCell>
                          <TableCell className="text-sm">
                            {student.facebookUrl ? (
                              <a
                                href={student.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs"
                              >
                                Profile
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{student.address || '-'}</TableCell>
                          <TableCell className="text-sm">{student.gender}</TableCell>
                          <TableCell className="text-sm">{student.dob}</TableCell>
                          <TableCell className="text-xs text-red-600 max-w-xs">
                            {student.errorMessage || ''}
                          </TableCell>
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
