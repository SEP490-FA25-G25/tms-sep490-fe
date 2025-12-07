import { Badge } from '@/components/ui/badge'
import type { ClassDetailDTO, TeacherSummaryDTO } from '@/store/services/classApi'
import { User } from 'lucide-react'

interface OverviewTabProps {
  classData: ClassDetailDTO
}

export function OverviewTab({ classData }: OverviewTabProps) {
  const teachers = classData.teachers || []

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      {/* Teachers Section */}
      {teachers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Giảng viên phụ trách</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher: TeacherSummaryDTO) => (
              <div
                key={teacher.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{teacher.fullName}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Số buổi dạy</span>
                  <Badge variant="secondary">{teacher.sessionCount} buổi</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Subject Info Section (previously Course) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin môn học</h3>
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Basic subject info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tên môn học</p>
              <p className="font-medium">{classData.subject.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mã môn học</p>
              <p className="font-medium">{classData.subject.code}</p>
            </div>
            {classData.subject.level?.curriculum && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Chương trình</p>
                <p className="font-medium">{classData.subject.level.curriculum.name}</p>
              </div>
            )}
            {classData.subject.level && ((
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trình độ</p>
                <Badge variant="secondary">{classData.subject.level.name}</Badge>
              </div>
            )}
          </div>

          {/* Session info */}
          <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng số giờ</p>
              <p className="font-medium">{classData.subject.totalHours || '—'} giờ</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Số buổi học</p>
              <p className="font-medium">{classData.subject.numberOfSessions || '—'} buổi</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Số giờ/buổi</p>
              <p className="font-medium">{classData.subject.hoursPerSession || '—'} giờ</p>
            </div>
          </div>

          {/* Description */}
          {classData.subject.description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Mô tả môn học</p>
              <p className="text-sm whitespace-pre-wrap">{classData.subject.description}</p>
            </div>
          )}

          {/* Target Audience */}
          {classData.subject.targetAudience && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Đối tượng học viên</p>
              <p className="text-sm whitespace-pre-wrap">{classData.subject.targetAudience}</p>
            </div>
          )}

          {/* Prerequisites */}
          {classData.subject.prerequisites && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Điều kiện tiên quyết</p>
              <p className="text-sm whitespace-pre-wrap">{classData.subject.prerequisites}</p>
            </div>
          )}

          {/* Teaching Methods */}
          {classData.subject.teachingMethods && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Phương pháp giảng dạy</p>
              <p className="text-sm whitespace-pre-wrap">{classData.subject.teachingMethods}</p>
            </div>
          )}
        </div>
      </div>

      {/* Class Audit Info Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin tạo lớp</h3>
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Người tạo</p>
              <p className="font-medium">{classData.createdByName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
              <p className="font-medium">{formatDateTime(classData.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cập nhật lần cuối</p>
              <p className="font-medium">{formatDateTime(classData.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
