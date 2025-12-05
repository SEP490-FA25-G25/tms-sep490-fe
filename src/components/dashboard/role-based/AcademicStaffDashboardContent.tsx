"use client"

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  AAKPISummary, 
  AAPendingRequestsTable, 
  AAQuickActionsPanel, 
  AATodaySessionsList, 
  type AAKPIData,
  type PendingRequestItem,
  type TodaySessionItem,
} from '@/components/academic/dashboard'

export function AcademicStaffDashboardContent() {
  const navigate = useNavigate()

  // Mock data - Replace with actual API calls when backend is ready
  const isLoading = false

  const kpiData: AAKPIData = {
    pendingRequests: { total: 12, urgent: 3 },
    todaySessions: { total: 8, needsSubstitute: 1 },
    newConsultations: { total: 5, unprocessed: 2 },
  }

  const pendingRequests: PendingRequestItem[] = [
    {
      id: 1,
      type: 'ABSENCE',
      requesterName: 'Nguyễn Văn A',
      requesterRole: 'STUDENT',
      className: 'IELTS Foundation 01',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isUrgent: true,
      summary: 'Xin nghỉ buổi học ngày 15/01 vì lý do sức khỏe',
    },
    {
      id: 2,
      type: 'TRANSFER',
      requesterName: 'Trần Thị B',
      requesterRole: 'STUDENT',
      className: 'IELTS Intermediate 02',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      summary: 'Xin chuyển sang lớp buổi tối do thay đổi lịch làm việc',
    },
    {
      id: 3,
      type: 'MAKEUP',
      requesterName: 'Lê Văn C',
      requesterRole: 'STUDENT',
      className: 'TOEIC 700+ 01',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      isUrgent: true,
      summary: 'Xin học bù buổi ngày 10/01 đã nghỉ',
    },
    {
      id: 4,
      type: 'REPLACEMENT',
      requesterName: 'GV. Phạm Văn D',
      requesterRole: 'TEACHER',
      className: 'IELTS Advanced 01',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      isUrgent: true,
      summary: 'Xin nghỉ dạy ngày 16/01, cần giáo viên thay thế',
    },
    {
      id: 5,
      type: 'RESCHEDULE',
      requesterName: 'GV. Hoàng Thị E',
      requesterRole: 'TEACHER',
      className: 'IELTS Foundation 03',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      summary: 'Xin đổi lịch buổi học thứ 4 sang thứ 5',
    },
  ]

  const todaySessions: TodaySessionItem[] = [
    {
      id: 1,
      className: 'IELTS Foundation 01',
      classCode: 'IF-01',
      startTime: '08:00',
      endTime: '10:00',
      room: 'Phòng 101',
      teacherName: 'GV. Nguyễn Văn X',
      status: 'NORMAL',
    },
    {
      id: 2,
      className: 'TOEIC 700+ 01',
      classCode: 'T7-01',
      startTime: '10:30',
      endTime: '12:30',
      room: 'Phòng 102',
      teacherName: 'GV. Trần Thị Y',
      status: 'NEEDS_SUBSTITUTE',
    },
    {
      id: 3,
      className: 'IELTS Intermediate 02',
      classCode: 'II-02',
      startTime: '14:00',
      endTime: '16:00',
      room: 'Phòng 201',
      teacherName: 'GV. Lê Văn Z',
      status: 'NORMAL',
    },
    {
      id: 4,
      className: 'IELTS Advanced 01',
      classCode: 'IA-01',
      startTime: '16:30',
      endTime: '18:30',
      room: 'Phòng 202',
      teacherName: 'GV. Phạm Thị W',
      status: 'SUBSTITUTE_ASSIGNED',
      substituteTeacherName: 'GV. Hoàng Văn K',
    },
  ]

  // State for request detail modal
  const [_selectedRequest, setSelectedRequest] = useState<PendingRequestItem | null>(null)

  // Handler để mở modal chi tiết request
  const handleViewRequest = (request: PendingRequestItem) => {
    setSelectedRequest(request)
    // TODO: Tích hợp với RequestDetailDialog component từ /academic/student-requests
    // Hiện tại chỉ log để demo behavior
    console.log('Opening request detail modal for:', request)
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Row 1: KPI Cards */}
      <AAKPISummary 
        data={kpiData} 
        isLoading={isLoading}
      />

      {/* Row 2: Pending Requests + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AAPendingRequestsTable 
            requests={pendingRequests}
            isLoading={isLoading}
            onViewAll={() => navigate('/academic/student-requests')}
            onViewRequest={handleViewRequest}
          />
        </div>
        <div className="lg:col-span-1">
          <AAQuickActionsPanel 
            onEnrollStudent={() => navigate('/academic/students')}
            onScheduleMakeup={() => navigate('/academic/student-requests?type=MAKEUP')}
            onProcessConsultation={() => navigate('/academic/consultation-registrations')}
            onViewReports={() => navigate('/academic/classes')}
          />
        </div>
      </div>

      {/* Row 3: Today Sessions (full width) */}
      <AATodaySessionsList 
        sessions={todaySessions}
        isLoading={isLoading}
        onViewSchedule={() => navigate('/schedule')}
        onAssignSubstitute={(sessionId) => navigate(`/academic/sessions/${sessionId}`)}
      />

      {/* TODO: Thêm RequestDetailDialog khi có component */}
      {/* <RequestDetailDialog 
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      /> */}
    </div>
  )
}