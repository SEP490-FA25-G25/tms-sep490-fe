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
  facebookUrl: string
  address: string
  gender: string
  dob: string
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
    facebookUrl: '',
    address: '',
    gender: '',
    dob: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!formData.gender) {
      toast.error('Gender is required')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format')
      return false
    }

    // Phone validation (optional - only validate if provided)
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9\-\+\s()]{10,15}$/
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error('Phone must be 10-15 digits')
        return false
      }
    }

    // Facebook URL validation (optional - only validate if provided)
    if (formData.facebookUrl.trim()) {
      try {
        new URL(formData.facebookUrl)
      } catch {
        toast.error('Invalid Facebook URL format')
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Prepare data for API call according to new format (no level field)
      const studentData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        facebookUrl: formData.facebookUrl || null,
        address: formData.address || null,
        gender: formData.gender,
        dob: formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : null,
      }

      // TODO: Call API to create student
      // await createStudent(studentData)

      console.log('Student data to be sent:', studentData)
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
      facebookUrl: '',
      address: '',
      gender: '',
      dob: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Student</DialogTitle>
          <DialogDescription>
            Add a new student to the system. They will be available for enrollment after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Student Code - Auto-generated (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="student-code">Student Code</Label>
            <Input
              id="student-code"
              placeholder="Auto-generated"
              value={formData.studentCode}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Student code will be automatically generated</p>
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
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0123456789"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
            />
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="e.g., 123 Main St, City"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
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
