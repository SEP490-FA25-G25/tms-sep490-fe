import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Facebook,
  Loader2,
  Save,
  Upload,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useUpdateStudentMutation,
  useDeleteSkillAssessmentMutation,
  type StudentDetailDTO,
  type UpdateStudentRequest,
  type SkillAssessmentUpdateInput,
  type SkillAssessmentDetailDTO,
} from '@/store/services/studentApi'
import { useGetLevelsQuery } from '@/store/services/curriculumApi'
import { useUploadFileMutation } from '@/store/services/uploadApi'

interface StudentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentDetailDTO | null
  onSuccess?: () => void
}

type Gender = 'MALE' | 'FEMALE' | 'OTHER'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type Skill = 'GENERAL' | 'READING' | 'WRITING' | 'SPEAKING' | 'LISTENING' | 'VOCABULARY' | 'GRAMMAR' | 'KANJI'

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Hoạt động', color: 'bg-green-100 text-green-700' },
  { value: 'SUSPENDED', label: 'Tạm khóa', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'INACTIVE', label: 'Đã nghỉ', color: 'bg-gray-100 text-gray-700' },
]

const skillOptions: { value: Skill; label: string }[] = [
  { value: 'GENERAL', label: 'Tổng quan' },
  { value: 'READING', label: 'Đọc hiểu' },
  { value: 'WRITING', label: 'Viết' },
  { value: 'SPEAKING', label: 'Nói' },
  { value: 'LISTENING', label: 'Nghe' },
  { value: 'VOCABULARY', label: 'Từ vựng' },
  { value: 'GRAMMAR', label: 'Ngữ pháp' },
  { value: 'KANJI', label: 'Kanji' },
]

const assessmentCategoryOptions = [
  { value: 'PLACEMENT', label: 'Kiểm tra xếp lớp' },
  { value: 'MOCK', label: 'Thi thử' },
  { value: 'OFFICIAL', label: 'Thi chính thức' },
  { value: 'PRACTICE', label: 'Luyện tập' },
]

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  // Handle ISO date string
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function StudentEditDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentEditDialogProps) {
  const [activeTab, setActiveTab] = useState('personal')
  
  // Form state for personal info
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    facebookUrl: '',
    avatarUrl: '',
    gender: 'MALE' as Gender,
    dateOfBirth: '',
    status: 'ACTIVE' as UserStatus,
  })

  // Skill assessments state - track both existing (with id) and new (without id)
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessmentUpdateInput[]>([])
  const [assessmentsToDelete, setAssessmentsToDelete] = useState<number[]>([])

  // Mutations
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation()
  const [deleteSkillAssessment, { isLoading: isDeleting }] = useDeleteSkillAssessmentMutation()
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation()

  // Get levels for skill assessment dropdown (get all levels without filter)
  const { data: levelsResponse } = useGetLevelsQuery(undefined)

  const levels = levelsResponse?.data || []

  // Reset form when student changes
  useEffect(() => {
    if (student && open) {
      setFormData({
        fullName: student.fullName || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        facebookUrl: student.facebookUrl || '',
        avatarUrl: student.avatarUrl || '',
        gender: (student.gender as Gender) || 'MALE',
        dateOfBirth: formatDateForInput(student.dateOfBirth),
        status: (student.status as UserStatus) || 'ACTIVE',
      })
      
      // Convert existing assessments to update input format
      const existingAssessments: SkillAssessmentUpdateInput[] = (student.skillAssessments || []).map((a: SkillAssessmentDetailDTO) => ({
        id: a.id,
        skill: a.skill as Skill,
        levelId: 0, // Will be resolved from levelCode
        rawScore: a.rawScore,
        scaledScore: a.scaledScore,
        scoreScale: a.scoreScale,
        assessmentCategory: a.assessmentCategory,
        assessmentDate: formatDateForInput(a.assessmentDate),
        assessmentType: a.assessmentType,
        note: a.note,
        // Keep original data for display
        _levelCode: a.levelCode,
        _levelName: a.levelName,
      })) as SkillAssessmentUpdateInput[]
      
      setSkillAssessments(existingAssessments)
      setAssessmentsToDelete([])
      setActiveTab('personal')
    }
  }, [student, open])

  // Resolve levelId from levelCode when levels are loaded
  useEffect(() => {
    if (levels.length > 0 && skillAssessments.length > 0) {
      setSkillAssessments(prev => 
        prev.map(a => {
          if (a.levelId === 0 && (a as unknown as { _levelCode?: string })._levelCode) {
            const level = levels.find(l => l.code === (a as unknown as { _levelCode?: string })._levelCode)
            return { ...a, levelId: level?.id || 0 }
          }
          return a
        })
      )
    }
  }, [levels, skillAssessments.length])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file tối đa là 5MB')
      return
    }

    try {
      const response = await uploadFile(file).unwrap()
      setFormData(prev => ({ ...prev, avatarUrl: response.url }))
      toast.success('Upload ảnh đại diện thành công')
    } catch (error) {
      console.error('Avatar upload failed:', error)
      toast.error('Upload ảnh thất bại. Vui lòng thử lại.')
    }

    // Reset input
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }))
  }

  const handleAddAssessment = () => {
    const newAssessment: SkillAssessmentUpdateInput = {
      skill: 'GENERAL',
      levelId: levels[0]?.id || 0,
      scaledScore: undefined,
      assessmentDate: new Date().toISOString().split('T')[0],
      assessmentCategory: 'PLACEMENT',
    }
    setSkillAssessments(prev => [...prev, newAssessment])
  }

  const handleAssessmentChange = (index: number, field: keyof SkillAssessmentUpdateInput, value: unknown) => {
    setSkillAssessments(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleRemoveAssessment = (index: number) => {
    const assessment = skillAssessments[index]
    if (assessment.id) {
      // Mark existing assessment for deletion
      setAssessmentsToDelete(prev => [...prev, assessment.id!])
    }
    setSkillAssessments(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email không hợp lệ')
      return false
    }
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      toast.error('Số điện thoại phải có 10-11 chữ số')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!student) return
    if (!validateForm()) return

    try {
      // Delete marked assessments first
      for (const assessmentId of assessmentsToDelete) {
        await deleteSkillAssessment({
          studentId: student.id,
          assessmentId,
        }).unwrap()
      }

      // Prepare update request
      const updateData: UpdateStudentRequest = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || undefined,
        facebookUrl: formData.facebookUrl?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        avatarUrl: formData.avatarUrl?.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        status: formData.status,
        skillAssessments: skillAssessments
          .filter(a => a.levelId > 0) // Only include valid assessments
          .map(a => ({
            id: a.id,
            skill: a.skill,
            levelId: a.levelId,
            rawScore: a.rawScore,
            scaledScore: a.scaledScore,
            scoreScale: a.scoreScale,
            assessmentCategory: a.assessmentCategory,
            assessmentDate: a.assessmentDate,
            assessmentType: a.assessmentType,
            note: a.note,
          })),
      }

      await updateStudent({
        studentId: student.id,
        data: updateData,
      }).unwrap()

      toast.success('Cập nhật thông tin học viên thành công')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Cập nhật thất bại'
      toast.error(errorMessage)
    }
  }

  const isLoading = isUpdating || isDeleting || isUploading

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={formData.avatarUrl || student.avatarUrl} alt={student.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(student.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">Chỉnh sửa thông tin học viên</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs">{student.studentCode}</span>
                <span>•</span>
                <span className="text-xs">{student.branchName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="assessments">
                Đánh giá kỹ năng ({skillAssessments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 overflow-x-hidden">
            <div className="px-6 py-4">
            <TabsContent value="personal" className="mt-0 space-y-4">
              {/* Avatar Upload */}
              <div className="space-y-3">
                <Label>Ảnh đại diện</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={formData.avatarUrl || undefined} alt="Avatar preview" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {student ? getInitials(student.fullName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
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
                        {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
                      </Button>
                      {formData.avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Định dạng: JPG, PNG, GIF. Tối đa 5MB.
                    </p>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Số điện thoại
                  </Label>
                  <Input
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Ngày sinh
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giới tính <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
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
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Địa chỉ
                </Label>
                <Textarea
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  Facebook
                </Label>
                <Input
                  placeholder="https://facebook.com/username"
                  value={formData.facebookUrl}
                  onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="mt-0 space-y-4">
              {skillAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Chưa có đánh giá kỹ năng nào</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleAddAssessment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm đánh giá
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {skillAssessments.map((assessment, index) => (
                    <div
                      key={assessment.id || `new-${index}`}
                      className="border rounded-lg p-4 space-y-3 bg-muted/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {assessment.id ? 'Đánh giá #' + assessment.id : 'Đánh giá mới'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveAssessment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Kỹ năng</Label>
                          <Select
                            value={assessment.skill}
                            onValueChange={(value) => handleAssessmentChange(index, 'skill', value)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {skillOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Trình độ</Label>
                          <Select
                            value={String(assessment.levelId)}
                            onValueChange={(value) => handleAssessmentChange(index, 'levelId', Number(value))}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Chọn trình độ" />
                            </SelectTrigger>
                            <SelectContent>
                              {levels.map((level) => (
                                <SelectItem key={level.id} value={String(level.id)}>
                                  {level.code} - {level.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Điểm quy đổi</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="7.5"
                            className="h-9"
                            value={assessment.scaledScore ?? ''}
                            onChange={(e) => handleAssessmentChange(index, 'scaledScore', e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Loại đánh giá</Label>
                          <Select
                            value={assessment.assessmentCategory || ''}
                            onValueChange={(value) => handleAssessmentChange(index, 'assessmentCategory', value)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                            <SelectContent>
                              {assessmentCategoryOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Ngày đánh giá</Label>
                          <Input
                            type="date"
                            className="h-9"
                            value={assessment.assessmentDate || ''}
                            onChange={(e) => handleAssessmentChange(index, 'assessmentDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Ghi chú</Label>
                        <Input
                          placeholder="Ghi chú thêm..."
                          className="h-9"
                          value={assessment.note || ''}
                          onChange={(e) => handleAssessmentChange(index, 'note', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddAssessment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm đánh giá kỹ năng
                  </Button>
                </div>
              )}
            </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {assessmentsToDelete.length > 0 && (
                <span className="text-destructive">
                  {assessmentsToDelete.length} đánh giá sẽ bị xóa
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
