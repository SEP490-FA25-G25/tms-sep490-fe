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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ChevronDown, ChevronUp, Plus, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { useCreateStudentMutation } from '@/store/services/studentApi'
import { useGetSubjectsWithLevelsQuery } from '@/store/services/curriculumApi'
import type { SkillAssessmentInput, CreateStudentResponse } from '@/store/services/studentApi'
import { cn } from '@/lib/utils'

interface CreateStudentDialogProps {
  classId: number
  branchId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (studentData: CreateStudentResponse) => void
}

interface StudentFormData {
  fullName: string
  email: string
  phone: string
  facebookUrl: string
  address: string
  gender: string
  dob: string
}

// Extended skill assessment with subject selection
interface SkillAssessmentFormData extends SkillAssessmentInput {
  subjectId?: number // For UI tracking which subject was selected
}

export function CreateStudentDialog({
  classId: _classId,
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: CreateStudentDialogProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    email: '',
    phone: '',
    facebookUrl: '',
    address: '',
    gender: '',
    dob: '',
  })
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessmentFormData[]>([])
  const [showSkillAssessments, setShowSkillAssessments] = useState(false)

  const [createStudent, { isLoading: isSubmitting }] = useCreateStudentMutation()
  const { data: subjectsResponse } = useGetSubjectsWithLevelsQuery()

  const subjects = subjectsResponse?.data || []

  // Get levels for a specific subject
  const getLevelsForSubject = (subjectId: number | undefined) => {
    if (!subjectId) return []
    const subject = subjects.find(s => s.id === subjectId)
    return subject?.levels || []
  }

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSkillAssessment = () => {
    setSkillAssessments(prev => [
      ...prev,
      { skill: 'GENERAL', levelId: 0, score: 0, note: '', subjectId: undefined }
    ])
  }

  const handleRemoveSkillAssessment = (index: number) => {
    setSkillAssessments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSkillAssessmentChange = (
    index: number,
    field: keyof SkillAssessmentFormData,
    value: string | number
  ) => {
    setSkillAssessments(prev => {
      const updated = [...prev]
      
      // If changing subject, reset levelId
      if (field === 'subjectId') {
        updated[index] = { ...updated[index], subjectId: value as number, levelId: 0 }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      
      return updated
    })
  }

  const validateForm = () => {
    // Required fields
    if (!formData.fullName.trim()) {
      toast.error('Họ và tên là bắt buộc')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email là bắt buộc')
      return false
    }
    if (!formData.gender) {
      toast.error('Giới tính là bắt buộc')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ')
      return false
    }

    // Phone validation (optional - only validate if provided)
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error('Số điện thoại phải có 10-11 chữ số')
        return false
      }
    }

    // Facebook URL validation (optional - only validate if provided)
    if (formData.facebookUrl.trim()) {
      try {
        new URL(formData.facebookUrl)
      } catch {
        toast.error('URL Facebook không hợp lệ')
        return false
      }
    }

    // DOB validation (optional - must be past date if provided)
    if (formData.dob) {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      if (dobDate >= today) {
        toast.error('Ngày sinh phải là ngày trong quá khứ')
        return false
      }
    }

    // Skill assessments validation
    for (let i = 0; i < skillAssessments.length; i++) {
      const assessment = skillAssessments[i]
      if (!assessment.subjectId) {
        toast.error(`Đánh giá kỹ năng ${i + 1}: Vui lòng chọn môn học`)
        return false
      }
      if (!assessment.levelId || assessment.levelId === 0) {
        toast.error(`Đánh giá kỹ năng ${i + 1}: Vui lòng chọn trình độ`)
        return false
      }
      if (assessment.score < 0 || assessment.score > 100) {
        toast.error(`Đánh giá kỹ năng ${i + 1}: Điểm số phải từ 0-100`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Remove subjectId before sending to API (only used for UI)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assessmentsToSubmit: SkillAssessmentInput[] = skillAssessments.map(({ subjectId, ...rest }) => rest)

      const result = await createStudent({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        facebookUrl: formData.facebookUrl || undefined,
        address: formData.address || undefined,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        dob: formData.dob || undefined,
        branchId,
        skillAssessments: assessmentsToSubmit.length > 0 ? assessmentsToSubmit : undefined,
      }).unwrap()

      const studentData = result.data

      // Close the dialog
      handleClose()

      // Pass student data to parent to show success dialog
      onSuccess(studentData)
    } catch (error) {
      // Handle API errors
      const err = error as { data?: { message?: string }; status?: number }
      
      if (err.data?.message) {
        const message = err.data.message
        if (message.includes('EMAIL_ALREADY_EXISTS')) {
          toast.error('Email đã tồn tại trong hệ thống')
        } else if (message.includes('BRANCH_NOT_FOUND')) {
          toast.error('Chi nhánh không tồn tại')
        } else if (message.includes('BRANCH_ACCESS_DENIED')) {
          toast.error('Bạn không có quyền tạo học viên cho chi nhánh này')
        } else if (message.includes('LEVEL_NOT_FOUND')) {
          toast.error('Mã trình độ không tồn tại trong hệ thống')
        } else {
          toast.error(message)
        }
      } else {
        toast.error('Không thể tạo học viên. Vui lòng thử lại.')
      }
    }
  }

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      facebookUrl: '',
      address: '',
      gender: '',
      dob: '',
    })
    setSkillAssessments([])
    setShowSkillAssessments(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tạo học viên mới</DialogTitle>
          <DialogDescription>
            Thêm học viên mới vào hệ thống. Họ sẽ có thể được ghi danh sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-1">
          {/* Student Code - Auto-generated */}
          <div className="space-y-2">
            <Label htmlFor="student-code">Mã học viên</Label>
            <Input
              id="student-code"
              placeholder="Tự động tạo"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Mã học viên sẽ được tự động tạo khi lưu
            </p>
          </div>

          {/* Password - Read-only */}
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              placeholder="12345678"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Mật khẩu mặc định là 12345678 (học viên cần đổi mật khẩu lần đầu đăng nhập)
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full-name">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full-name"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Ví dụ: student@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ví dụ: 0912345678"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">
              Giới tính <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label>Ngày sinh</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dob && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dob ? (
                    format(new Date(formData.dob), 'dd/MM/yyyy', { locale: vi })
                  ) : (
                    <span>Chọn ngày sinh</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dob ? new Date(formData.dob) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      // Format to YYYY-MM-DD for form state
                      const formattedDate = format(date, 'yyyy-MM-dd')
                      handleChange('dob', formattedDate)
                    } else {
                      handleChange('dob', '')
                    }
                  }}
                  captionLayout="dropdown"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Facebook URL */}
          <div className="space-y-2">
            <Label htmlFor="facebook-url">Facebook URL</Label>
            <Input
              id="facebook-url"
              type="url"
              placeholder="https://facebook.com/username"
              value={formData.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              placeholder="Ví dụ: 123 Đường ABC, Quận 1"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          {/* Skill Assessments - Collapsible */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between px-0"
              onClick={() => setShowSkillAssessments(!showSkillAssessments)}
            >
              <span className="font-medium">Đánh giá kỹ năng (Tùy chọn)</span>
              {showSkillAssessments ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showSkillAssessments && (
              <div className="mt-4 space-y-4">
                {skillAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có đánh giá kỹ năng nào. Click nút bên dưới để thêm.
                  </p>
                ) : (
                  skillAssessments.map((assessment, index) => {
                    const availableLevels = getLevelsForSubject(assessment.subjectId)
                    
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Đánh giá {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSkillAssessment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Subject Selection */}
                          <div className="space-y-2 col-span-2">
                            <Label>
                              Môn học <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={assessment.subjectId?.toString() || ''}
                              onValueChange={(value) =>
                                handleSkillAssessmentChange(index, 'subjectId', parseInt(value))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn môn học" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id.toString()}>
                                    {subject.name} ({subject.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Level Selection - Cascading from Subject */}
                          <div className="space-y-2 col-span-2">
                            <Label>
                              Trình độ <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={assessment.levelId?.toString() || ''}
                              onValueChange={(value) =>
                                handleSkillAssessmentChange(index, 'levelId', parseInt(value))
                              }
                              disabled={!assessment.subjectId}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={
                                  assessment.subjectId 
                                    ? "Chọn trình độ" 
                                    : "Chọn môn học trước"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLevels.map((level) => (
                                  <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.code} - {level.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Skill Type */}
                          <div className="space-y-2">
                            <Label>Kỹ năng</Label>
                            <Select
                              value={assessment.skill}
                              onValueChange={(value) =>
                                handleSkillAssessmentChange(index, 'skill', value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GENERAL">Tổng quát</SelectItem>
                                <SelectItem value="READING">Đọc</SelectItem>
                                <SelectItem value="WRITING">Viết</SelectItem>
                                <SelectItem value="SPEAKING">Nói</SelectItem>
                                <SelectItem value="LISTENING">Nghe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Score */}
                          <div className="space-y-2">
                            <Label>Điểm (0-100)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={assessment.score}
                              onChange={(e) =>
                                handleSkillAssessmentChange(index, 'score', parseInt(e.target.value) || 0)
                              }
                            />
                          </div>

                          {/* Note */}
                          <div className="space-y-2 col-span-2">
                            <Label>Ghi chú</Label>
                            <Input
                              placeholder="Tùy chọn"
                              value={assessment.note || ''}
                              onChange={(e) =>
                                handleSkillAssessmentChange(index, 'note', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddSkillAssessment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm đánh giá kỹ năng
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Đang tạo...' : 'Tạo học viên'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
