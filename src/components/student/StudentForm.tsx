import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Calendar } from '@/components/ui/calendar'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CalendarIcon,
  Upload,
  Loader2,
  User,
  Trash2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  isValidEmail,
  isValidPhone,
  isValidDob,
  isValidUrl,
  isValidScore,
  getAvailableSkills,
} from '@/lib/validations'

import { useUploadFileMutation } from '@/store/services/uploadApi'
import { useGetSubjectsWithLevelsQuery } from '@/store/services/curriculumApi'
import { useGetAssessorsForBranchQuery } from '@/store/services/studentApi'
import type { SkillAssessmentUpdateInput, StudentDetailDTO, SkillAssessmentDetailDTO } from '@/store/services/studentApi'

// ========== Types ==========
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface StudentFormData {
  fullName: string
  email: string
  phone: string
  facebookUrl: string
  address: string
  gender: string
  dob: string
  avatarUrl: string
  status?: UserStatus
}

export interface SkillAssessmentFormData {
  id?: number // For edit mode - existing assessment ID
  skill: string
  levelId: number
  rawScore?: string
  scoreScale?: string
  note?: string
  subjectId?: number
  assessedByUserId?: number
  assessmentDate?: string
  // For display purposes (edit mode)
  _levelCode?: string
  _levelName?: string
  _assessedByFullName?: string
}

export interface StudentFormProps {
  mode: 'create' | 'edit'
  branchId: number
  initialData?: StudentDetailDTO
  onSubmit: (data: {
    formData: StudentFormData
    skillAssessments: SkillAssessmentUpdateInput[]
    assessmentsToDelete?: number[]
  }) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
  submitLabel?: string
}

// ========== Types for SkillAssessmentItem ==========
interface SubjectWithLevels {
  id: number
  name: string
  code: string
  levels: { id: number; code: string; name: string }[]
}

interface SkillOption {
  value: string
  label: string
}

interface AssessorOption {
  userId: number
  fullName: string
}

// ========== Status Options ==========
const statusOptions: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'SUSPENDED', label: 'Tạm khóa' },
  { value: 'INACTIVE', label: 'Đã nghỉ' },
]

// ========== Score Input Component ==========
function ScoreInput({
  rawScore,
  onChange,
}: {
  rawScore?: string
  onChange: (value: string | undefined) => void
}) {
  const scoreValue = rawScore?.split('/')[0] ?? ''
  const maxScoreValue = rawScore?.split('/')[1] ?? ''

  const scoreNum = parseFloat(scoreValue)
  const maxScoreNum = parseFloat(maxScoreValue)

  // Validation states
  const hasScore = scoreValue !== ''
  const hasMaxScore = maxScoreValue !== ''
  const isMaxScoreValid = hasMaxScore && !isNaN(maxScoreNum) && maxScoreNum > 0 && maxScoreNum <= 9999
  const isScoreInRange = !hasScore || (hasMaxScore && scoreNum >= 0 && scoreNum <= maxScoreNum)

  const showScoreError = hasScore && !isScoreInRange

  return (
    <div className="space-y-2">
      <Label className="text-xs">Điểm đầu vào</Label>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Điểm"
          disabled={!isMaxScoreValid}
          className={cn(
            'w-20 text-center',
            showScoreError && 'border-destructive focus-visible:ring-destructive'
          )}
          value={scoreValue}
          onChange={(e) => {
            const score = e.target.value.replace(/[^0-9.]/g, '')
            // Prevent score > maxScore
            const scoreNumNew = parseFloat(score)
            if (score && !isNaN(scoreNumNew) && scoreNumNew > maxScoreNum) return
            onChange(`${score}/${maxScoreValue}`)
          }}
        />
        <span className="text-muted-foreground font-medium">/</span>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Tối đa"
          maxLength={4}
          className="w-20 text-center"
          value={maxScoreValue}
          onChange={(e) => {
            const maxScore = e.target.value.replace(/[^0-9]/g, '')
            // Prevent maxScore > 9999 (maxLength=4 handles this, but extra safety)
            if (maxScore.length > 4) return
            // Clear score if max score changes
            onChange(maxScore ? `/${maxScore}` : undefined)
          }}
        />
      </div>
      {showScoreError && (
        <p className="text-xs text-destructive">Điểm phải từ 0-{maxScoreNum}</p>
      )}
    </div>
  )
}

// ========== Assessor Combobox Component ==========
function AssessorCombobox({
  assessors,
  selectedUserId,
  fallbackName,
  onChange,
}: {
  assessors: AssessorOption[]
  selectedUserId?: number
  fallbackName?: string
  onChange: (value: number | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  const selectedAssessor = assessors.find((a) => a.userId === selectedUserId)
  const displayName = selectedAssessor?.fullName || fallbackName

  return (
    <div className="space-y-2">
      <Label className="text-xs">Người đánh giá</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {displayName ? (
              <span className="truncate">{displayName}</span>
            ) : (
              <span className="text-muted-foreground">Chọn người đánh giá</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm giáo viên..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy giáo viên</CommandEmpty>
              <CommandGroup>
                {assessors.map((assessor) => (
                  <CommandItem
                    key={assessor.userId}
                    value={assessor.fullName}
                    onSelect={() => {
                      onChange(assessor.userId)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedUserId === assessor.userId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{assessor.fullName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ========== Skill Assessment Item Component ==========
function SkillAssessmentItem({
  index,
  assessment,
  subjects,
  selectedSubject,
  availableLevels,
  availableSkills,
  assessors,
  onRemove,
  onChange,
}: {
  index: number
  assessment: SkillAssessmentFormData
  subjects: SubjectWithLevels[]
  selectedSubject: SubjectWithLevels | undefined
  availableLevels: { id: number; code: string; name: string }[]
  availableSkills: SkillOption[]
  assessors: AssessorOption[]
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof SkillAssessmentFormData, value: string | number | undefined) => void
}) {
  const [subjectOpen, setSubjectOpen] = useState(false)

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {assessment.id ? `Đánh giá #${assessment.id}` : `Đánh giá ${index + 1}`}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Subject - Combobox with search */}
        <div className="space-y-2">
          <Label className="text-xs">
            Môn học <span className="text-destructive">*</span>
          </Label>
          <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={subjectOpen}
                className="w-full justify-between font-normal"
              >
                {selectedSubject ? (
                  <span className="truncate">{selectedSubject.name}</span>
                ) : (
                  <span className="text-muted-foreground">Chọn môn học</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Tìm môn học..." />
                <CommandList>
                  <CommandEmpty>Không tìm thấy môn học</CommandEmpty>
                  <CommandGroup>
                    {subjects.map((subject) => (
                      <CommandItem
                        key={subject.id}
                        value={`${subject.name} ${subject.code}`}
                        onSelect={() => {
                          onChange(index, 'subjectId', subject.id)
                          setSubjectOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            assessment.subjectId === subject.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{subject.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{subject.code}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Level */}
        <div className="space-y-2">
          <Label className="text-xs">
            Trình độ <span className="text-destructive">*</span>
          </Label>
          <Select
            value={assessment.levelId?.toString() || ''}
            onValueChange={(value) => onChange(index, 'levelId', parseInt(value))}
            disabled={!assessment.subjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={assessment.subjectId ? 'Chọn trình độ' : 'Chọn môn học trước'}
              />
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

        {/* Skill */}
        <div className="space-y-2">
          <Label className="text-xs">Kỹ năng</Label>
          <Select
            value={assessment.skill}
            onValueChange={(value) => onChange(index, 'skill', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSkills.map((skill) => (
                <SelectItem key={skill.value} value={skill.value}>
                  {skill.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Score - format n/n */}
        <ScoreInput
          rawScore={assessment.rawScore}
          onChange={(value) => onChange(index, 'rawScore', value)}
        />
      </div>

      {/* Assessor - Combobox with search */}
      <AssessorCombobox
        assessors={assessors}
        selectedUserId={assessment.assessedByUserId}
        fallbackName={assessment._assessedByFullName}
        onChange={(value) => onChange(index, 'assessedByUserId', value)}
      />

      {/* Note - full width */}
      <div className="space-y-2">
        <Label className="text-xs">Ghi chú</Label>
        <Input
          placeholder="Ghi chú về kết quả đánh giá"
          value={assessment.note || ''}
          onChange={(e) => onChange(index, 'note', e.target.value)}
        />
      </div>
    </div>
  )
}

// ========== Helper Functions ==========
function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

// ========== Component ==========
export function StudentForm({
  mode,
  branchId,
  initialData,
  onSubmit,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: StudentFormProps) {
  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    email: '',
    phone: '',
    facebookUrl: '',
    address: '',
    gender: '',
    dob: '',
    avatarUrl: '',
    status: 'ACTIVE',
  })
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessmentFormData[]>([])
  const [assessmentsToDelete, setAssessmentsToDelete] = useState<number[]>([])
  const [showSkillAssessments, setShowSkillAssessments] = useState(false)

  // API hooks
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation()
  const { data: subjectsResponse } = useGetSubjectsWithLevelsQuery()
  const { data: assessorsResponse } = useGetAssessorsForBranchQuery(branchId, {
    skip: !branchId,
  })

  const subjects = useMemo(() => subjectsResponse?.data || [], [subjectsResponse?.data])
  const assessors = useMemo(() => assessorsResponse?.data || [], [assessorsResponse?.data])

  // Initialize form data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        facebookUrl: initialData.facebookUrl || '',
        address: initialData.address || '',
        gender: initialData.gender || '',
        dob: formatDateForInput(initialData.dateOfBirth),
        avatarUrl: initialData.avatarUrl || '',
        status: (initialData.status as UserStatus) || 'ACTIVE',
      })

      // Convert existing assessments to form format
      const existingAssessments: SkillAssessmentFormData[] = (initialData.skillAssessments || []).map(
        (a: SkillAssessmentDetailDTO) => ({
          id: a.id,
          skill: a.skill,
          levelId: 0, // Will be resolved from levelCode
          rawScore: a.rawScore,
          scoreScale: a.scoreScale,
          note: a.note,
          assessedByUserId: a.assessedBy?.userId,
          assessmentDate: formatDateForInput(a.assessmentDate),
          // For display purposes
          _levelCode: a.levelCode,
          _levelName: a.levelName,
          _assessedByFullName: a.assessedBy?.fullName,
          // Need to find subjectId from levelCode
          subjectId: undefined,
        })
      )

      setSkillAssessments(existingAssessments)
      setAssessmentsToDelete([])

      // Auto-expand if there are assessments
      if (existingAssessments.length > 0) {
        setShowSkillAssessments(true)
      }
    }
  }, [mode, initialData])

  // Resolve levelId and subjectId from levelCode when subjects are loaded (edit mode)
  useEffect(() => {
    if (mode === 'edit' && subjects.length > 0 && skillAssessments.length > 0) {
      setSkillAssessments((prev) =>
        prev.map((a) => {
          if (a._levelCode && (a.levelId === 0 || !a.subjectId)) {
            // Find the subject and level from levelCode
            for (const subject of subjects) {
              const level = subject.levels.find((l) => l.code === a._levelCode)
              if (level) {
                return {
                  ...a,
                  subjectId: subject.id,
                  levelId: level.id,
                }
              }
            }
          }
          return a
        })
      )
    }
  }, [mode, subjects, skillAssessments.length])

  // Auto-detect score scale from subject
  const detectScoreScaleFromSubject = (subject: { name: string; code?: string } | undefined): string => {
    if (!subject) return '0-100'

    const name = subject.name.toLowerCase()
    const code = subject.code?.toLowerCase() || ''

    if (name.includes('ielts')) return '0-9'
    if (name.includes('toeic')) return '0-990'
    if (name.includes('n5') || code.includes('n5')) return 'N5'
    if (name.includes('n4') || code.includes('n4')) return 'N4'
    if (name.includes('n3') || code.includes('n3')) return 'N3'
    if (name.includes('n2') || code.includes('n2')) return 'N2'
    if (name.includes('n1') || code.includes('n1')) return 'N1'

    return '0-100'
  }

  // Get levels for a specific subject
  const getLevelsForSubject = (subjectId: number | undefined) => {
    if (!subjectId) return []
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.levels || []
  }

  // Handlers
  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file tối đa là 5MB')
      return
    }

    try {
      const response = await uploadFile(file).unwrap()
      setFormData((prev) => ({ ...prev, avatarUrl: response.url }))
      toast.success('Upload ảnh đại diện thành công')
    } catch (error) {
      console.error('Avatar upload failed:', error)
      toast.error('Upload ảnh thất bại. Vui lòng thử lại.')
    }

    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }))
  }

  const handleAddSkillAssessment = () => {
    setSkillAssessments((prev) => [
      ...prev,
      {
        skill: 'GENERAL',
        levelId: 0,
        rawScore: undefined,
        scoreScale: '0-100',
        note: '',
        subjectId: undefined,
        assessedByUserId: undefined,
        assessmentDate: new Date().toISOString().split('T')[0],
      },
    ])
  }

  const handleRemoveSkillAssessment = (index: number) => {
    const assessment = skillAssessments[index]
    if (assessment.id) {
      // Mark existing assessment for deletion (edit mode)
      setAssessmentsToDelete((prev) => [...prev, assessment.id!])
    }
    setSkillAssessments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSkillAssessmentChange = (
    index: number,
    field: keyof SkillAssessmentFormData,
    value: string | number | undefined
  ) => {
    setSkillAssessments((prev) => {
      const updated = [...prev]

      if (field === 'subjectId' && value) {
        const subjectIdNum = typeof value === 'string' ? parseInt(value) : value
        const selectedSubject = subjects.find((s) => s.id === subjectIdNum)
        const detectedScale = detectScoreScaleFromSubject(selectedSubject)

        updated[index] = {
          ...updated[index],
          subjectId: subjectIdNum,
          levelId: 0,
          scoreScale: detectedScale,
        }
      } else if (field === 'levelId' && value) {
        const levelIdNum = typeof value === 'string' ? parseInt(value) : value
        updated[index] = { ...updated[index], levelId: levelIdNum }
      } else if (field === 'assessedByUserId') {
        updated[index] = {
          ...updated[index],
          assessedByUserId: value ? (typeof value === 'string' ? parseInt(value) : value) : undefined,
        }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }

      return updated
    })
  }

  const validateForm = (): boolean => {
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
    if (!isValidEmail(formData.email)) {
      toast.error('Email không hợp lệ')
      return false
    }

    // Phone validation
    if (!isValidPhone(formData.phone)) {
      toast.error('Số điện thoại phải có 10-11 chữ số')
      return false
    }

    // Facebook URL validation
    if (!isValidUrl(formData.facebookUrl)) {
      toast.error('URL Facebook không hợp lệ')
      return false
    }

    // DOB validation
    if (!isValidDob(formData.dob)) {
      toast.error('Ngày sinh phải là ngày trong quá khứ')
      return false
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
      if (assessment.rawScore !== undefined) {
        if (!isValidScore(assessment.rawScore)) {
          toast.error(`Đánh giá kỹ năng ${i + 1}: Điểm số phải có định dạng n/n (ví dụ: 35/40)`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // Transform to API format
    const assessmentsToSubmit: SkillAssessmentUpdateInput[] = skillAssessments
      .filter((a) => a.levelId > 0) // Only include valid assessments
      .map((assessment) => ({
        id: assessment.id,
        skill: assessment.skill as SkillAssessmentUpdateInput['skill'],
        levelId: assessment.levelId,
        rawScore: assessment.rawScore,
        scoreScale: assessment.scoreScale,
        note: assessment.note,
        assessedByUserId: assessment.assessedByUserId,
        assessmentDate: assessment.assessmentDate,
      }))

    await onSubmit({
      formData,
      skillAssessments: assessmentsToSubmit,
      assessmentsToDelete: mode === 'edit' ? assessmentsToDelete : undefined,
    })
  }

  const isLoading = isSubmitting || isUploading
  const defaultSubmitLabel = mode === 'create' ? 'Tạo học viên' : 'Lưu thay đổi'

  return (
    <div className="space-y-6">
      {/* Avatar & Basic Info Section */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2">
              <AvatarImage src={formData.avatarUrl || undefined} alt="Avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {formData.fullName ? getInitials(formData.fullName) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            {formData.avatarUrl && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full p-0"
                onClick={handleRemoveAvatar}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Đang tải...' : 'Tải ảnh'}
            </Button>
            <p className="text-[10px] text-muted-foreground">JPG, PNG. Max 5MB</p>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Basic Info Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2 sm:col-span-2">
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
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

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0912345678"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label>Ngày sinh</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.dob && 'text-muted-foreground'
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

          {/* Status (only in edit mode) */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              placeholder="123 Đường ABC, Quận 1"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          {/* Facebook URL */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="facebook-url">Facebook URL</Label>
            <Input
              id="facebook-url"
              type="url"
              placeholder="https://facebook.com/username"
              value={formData.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Auto-generated Fields Info (only in create mode) */}
      {mode === 'create' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mã học viên</Label>
            <div className="text-sm font-medium">Tự động tạo sau khi lưu</div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mật khẩu mặc định</Label>
            <div className="text-sm font-mono">12345678</div>
          </div>
        </div>
      )}

      {/* Student Info (only in edit mode) */}
      {mode === 'edit' && initialData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mã học viên</Label>
            <div className="text-sm font-mono font-medium">{initialData.studentCode}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Chi nhánh</Label>
            <div className="text-sm font-medium">{initialData.branchName}</div>
          </div>
        </div>
      )}

      {/* Skill Assessments Section - Collapsible */}
      <Collapsible open={showSkillAssessments} onOpenChange={setShowSkillAssessments}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">Đánh giá kỹ năng đầu vào</span>
              {skillAssessments.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {skillAssessments.length}
                </span>
              )}
              {assessmentsToDelete.length > 0 && (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  -{assessmentsToDelete.length}
                </span>
              )}
            </div>
            {showSkillAssessments ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'create'
              ? 'Thêm đánh giá kỹ năng đầu vào cho học viên (tùy chọn). Có thể bổ sung sau.'
              : 'Quản lý đánh giá kỹ năng của học viên.'}
          </p>

          {skillAssessments.length === 0 ? (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <p className="text-sm text-muted-foreground mb-3">Chưa có đánh giá kỹ năng nào</p>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSkillAssessment}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm đánh giá
              </Button>
            </div>
          ) : (
            <>
              {skillAssessments.map((assessment, index) => {
                const availableLevels = getLevelsForSubject(assessment.subjectId)
                const selectedSubject = subjects.find((s) => s.id === assessment.subjectId)
                const availableSkills = getAvailableSkills(selectedSubject?.name, selectedSubject?.code)

                return (
                  <SkillAssessmentItem
                    key={assessment.id || `new-${index}`}
                    index={index}
                    assessment={assessment}
                    subjects={subjects}
                    selectedSubject={selectedSubject}
                    availableLevels={availableLevels}
                    availableSkills={availableSkills}
                    assessors={assessors}
                    onRemove={handleRemoveSkillAssessment}
                    onChange={handleSkillAssessmentChange}
                  />
                )
              })}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddSkillAssessment}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm đánh giá kỹ năng
              </Button>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
            </>
          ) : (
            submitLabel || defaultSubmitLabel
          )}
        </Button>
      </div>
    </div>
  )
}
