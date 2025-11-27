import type { CourseDetail } from '@/store/services/courseApi'
import { Clock, Calendar, Users, BookOpen, Target } from 'lucide-react'

interface CourseOverviewProps {
  course: CourseDetail
}

export function CourseOverview({ course }: CourseOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Tổng quan khóa học</h2>
      </div>

      {/* Key Information Grid */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {course.totalHours && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Tổng thời gian</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.totalHours}</p>
              <p className="text-sm text-gray-600">giờ học</p>
            </div>
          )}

          {course.durationWeeks && (
            <div className="lg:border-l lg:pl-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Thời gian</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.durationWeeks}</p>
              <p className="text-sm text-gray-600">tuần</p>
            </div>
          )}

          {course.totalSessions && (
            <div className="md:border-l md:pl-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Buổi học</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.totalSessions}</p>
              <p className="text-sm text-gray-600">buổi</p>
            </div>
          )}

          {course.sessionPerWeek && (
            <div className="lg:border-l lg:pl-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-gray-900">Lịch học</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.sessionPerWeek}</p>
              <p className="text-sm text-gray-600">buổi/tuần</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Details */}
      <div className="prose max-w-none">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {course.subjectName && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Môn học:</span>
                  <p className="text-gray-900">{course.subjectName}</p>
                </div>
              )}

              {course.levelName && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Trình độ:</span>
                  <p className="text-gray-900">{course.levelName}</p>
                </div>
              )}

              {course.scoreScale && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Thang điểm:</span>
                  <p className="text-gray-900">{course.scoreScale}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {course.targetAudience && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Đối tượng:</span>
                  <p className="text-gray-900">{course.targetAudience}</p>
                </div>
              )}

              {course.teachingMethods && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Phương pháp:</span>
                  <p className="text-gray-900">{course.teachingMethods}</p>
                </div>
              )}

              {course.effectiveDate && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Ngày hiệu lực:</span>
                  <p className="text-gray-900">
                    {new Date(course.effectiveDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {course.prerequisites && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Điều kiện tiên quyết</h4>
              <p className="text-gray-700">{course.prerequisites}</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Mục tiêu khóa học</h3>
        </div>
        <p className="text-blue-800">
          Khóa học này được thiết kế để giúp sinh viên nắm vững kiến thức nền tảng và kỹ năng thực hành
          trong lĩnh vực {course.subjectName?.toLowerCase()}. Sau khi hoàn thành khóa học, sinh viên sẽ
          có khả năng áp dụng các kiến thức đã học vào thực tế và phát triển chuyên môn một cách toàn diện.
        </p>
      </div>
    </div>
  )
}