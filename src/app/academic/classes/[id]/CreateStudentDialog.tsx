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
import { toast } from 'sonner'

interface CreateStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface StudentFormData {
  studentCode: string
  fullName: string
  email: string
  phone: string
  level: string
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateStudentDialogProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    studentCode: '',
    fullName: '',
    email: '',
    phone: '',
    level: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.studentCode.trim()) {
      toast.error('Student code is required')
      return false
    }
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone is required')
      return false
    }
    if (!formData.level) {
      toast.error('Level is required')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format')
      return false
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast.error('Phone must be 10-15 digits')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // TODO: Call API to create student
      // await createStudent(formData)

      toast.success('Student created successfully')
      onSuccess()
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create student'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      studentCode: '',
      fullName: '',
      email: '',
      phone: '',
      level: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Student</DialogTitle>
          <DialogDescription>
            Add a new student to the system. They will be available for enrollment after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Code */}
          <div className="space-y-2">
            <Label htmlFor="student-code">Student Code *</Label>
            <Input
              id="student-code"
              placeholder="e.g., STU2024001"
              value={formData.studentCode}
              onChange={(e) => handleChange('studentCode', e.target.value)}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name *</Label>
            <Input
              id="full-name"
              placeholder="e.g., Nguyen Van A"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., student@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0123456789"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="level">Level *</Label>
            <Select value={formData.level} onValueChange={(value) => handleChange('level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="ELEMENTARY">Elementary</SelectItem>
                <SelectItem value="PRE_INTERMEDIATE">Pre-Intermediate</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="UPPER_INTERMEDIATE">Upper Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
